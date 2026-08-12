import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
        }

        const { sessionId } = await req.json();
        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
        }

        console.log(`[VERIFY] Verificando checkout -> sessionId=${sessionId} user=${(session.user as any).id}`);

        await dbConnect();

        let checkoutSession;
        try {
            checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ['subscription', 'customer'],
            });
        } catch {
            console.error(`[VERIFY] Sesión inválida o inexistente -> sessionId=${sessionId} user=${(session.user as any).id}`);
            return NextResponse.json({ error: 'Sesión de pago inválida' }, { status: 400 });
        }

        if (
            checkoutSession.payment_status !== 'paid' &&
            checkoutSession.payment_status !== 'no_payment_required'
        ) {
            console.error(`[VERIFY] Pago no completado -> sessionId=${sessionId} payment_status=${checkoutSession.payment_status}`);
            return NextResponse.json({ error: 'Pago no completado' }, { status: 400 });
        }

        const metadata = checkoutSession.metadata || {};
        const metadataUserId = metadata.userId;
        const planId = metadata.planId;
        const planName = metadata.planName;
        const customerId = (checkoutSession.customer as string) || null;

        const loggedInUserId = (session.user as any).id;
        const isOwner = metadataUserId && metadataUserId === loggedInUserId;

        if (!isOwner) {
            const user = (await User.findById(loggedInUserId).lean()) as any;
            const emailMatch = user?.email && checkoutSession.customer_details?.email === user.email;
            const customerMatch = user?.stripeCustomerId && customerId === user.stripeCustomerId;
            if (!emailMatch && !customerMatch) {
                console.error(`[VERIFY] Sesión no pertenece al usuario -> userId=${loggedInUserId} metadataUserId=${metadataUserId} sessionEmail=${checkoutSession.customer_details?.email} userEmail=${user?.email}`);
                return NextResponse.json({ error: 'Esta sesión de pago no pertenece a tu cuenta' }, { status: 403 });
            }
        }

        if (!planName) {
            console.error(`[VERIFY] Sin plan en la sesión -> sessionId=${sessionId} metadata=${JSON.stringify(metadata)}`);
            return NextResponse.json({ error: 'No hay plan en la sesión' }, { status: 400 });
        }

        const planValue = planId
            ? (planId === 'fleet' ? 'fleet' : 'premium')
            : (planName?.toLowerCase() === 'flotilla' ? 'fleet' : 'premium');

        const subscriptionId = checkoutSession.subscription as string | null;
        let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        let subscriptionStatus = 'active';
        if (subscriptionId) {
            try {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                periodEnd = new Date((sub as any).current_period_end * 1000);
                subscriptionStatus = sub.status;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                console.error(`[VERIFY] Error retrieving subscription ${subscriptionId}:`, msg);
            }
        } else if (metadata.durationDays) {
            // Pago único (plan flex): expiración = now + durationDays.
            const durationDays = parseInt(metadata.durationDays, 10) || 30;
            periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        }

        const updateData = {
            plan: planValue,
            subscriptionStatus,
            subscriptionExpiry: periodEnd,
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            ...(customerId ? { stripeCustomerId: customerId } : {}),
        };

        let result = null;
        if (metadataUserId) {
            result = await User.findByIdAndUpdate(metadataUserId, { $set: updateData }, { new: true });
        }
        if (!result && checkoutSession.customer_details?.email) {
            result = await User.findOneAndUpdate(
                { email: checkoutSession.customer_details.email },
                { $set: updateData },
                { new: true }
            );
        }
        if (!result && customerId) {
            result = await User.findOneAndUpdate({ stripeCustomerId: customerId }, { $set: updateData }, { new: true });
        }

        if (!result) {
            console.error(`[VERIFY] Usuario no encontrado -> sessionId=${sessionId} metadataUserId=${metadataUserId} email=${checkoutSession.customer_details?.email} customerId=${customerId}`);
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        console.log(`[VERIFY] Checkout verificado -> plan=${planValue} user=${checkoutSession.customer_details?.email || metadataUserId}`);

        return NextResponse.json({
            success: true,
            plan: result.plan,
            subscriptionStatus: result.subscriptionStatus,
            subscriptionExpiry: result.subscriptionExpiry || null,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[VERIFY] Error:', err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
