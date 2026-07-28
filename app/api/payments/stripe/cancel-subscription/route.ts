import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { stripe } from '@/app/lib/stripe';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (user.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.update(user.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });

                await User.findByIdAndUpdate(user._id, {
                    $set: {
                        subscriptionStatus: 'expired',
                        canceledAt: new Date(),
                    },
                });

                return NextResponse.json({
                    message: 'Tu suscripción será cancelada al finalizar el periodo actual. Seguirás teniendo acceso Premium hasta entonces.',
                    status: 'canceling',
                });
            } catch (err: any) {
                console.error('STRIPE SUBSCRIPTION CANCEL ERR:', err.message);
                return NextResponse.json({ error: 'Error al cancelar en Stripe' }, { status: 500 });
            }
        }

        // No Stripe ID — downgrade directly
        await User.findByIdAndUpdate(user._id, {
            $set: {
                plan: 'free',
                subscriptionStatus: 'none',
                canceledAt: new Date(),
            },
        });

        return NextResponse.json({
            message: 'Suscripción cancelada correctamente.',
            plan: 'free',
        });

    } catch (err: any) {
        console.error('SERVER CANCEL SUBSCRIPTION ERROR:', err.message);
        return NextResponse.json({ error: err.message || 'Error al procesar la cancelación' }, { status: 500 });
    }
}
