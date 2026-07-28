import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Pricing from '@/app/models/Pricing';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Debes iniciar sesión para suscribirte' }, { status: 401 });
        }

        const { planName } = await req.json();

        await dbConnect();

        const pricing = await Pricing.findOne();
        if (!pricing || !pricing.plans || pricing.plans.length === 0) {
            return NextResponse.json({ error: 'No hay planes configurados' }, { status: 400 });
        }

        const plan = pricing.plans.find((p: any) => p.name === planName);
        if (!plan) {
            return NextResponse.json({ error: `Plan "${planName}" no encontrado` }, { status: 400 });
        }

        if (plan.ctaLink) {
            return NextResponse.json({ redirect: plan.ctaLink });
        }

        let user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || '',
                metadata: {
                    userId: user._id.toString(),
                },
            });
            customerId = customer.id;
            user.stripeCustomerId = customerId;
            await user.save();
        }

        const priceId = plan.stripePriceId;

        if (!priceId) {
            return NextResponse.json({
                error: `ID de precio no configurado para "${planName}". Configúralo en el panel de administración.`
            }, { status: 400 });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
            metadata: {
                userId: user._id.toString(),
                planName: plan.name,
                planId: plan.id,
            },
            subscription_data: {
                trial_period_days: plan.trialDays || 0,
                metadata: {
                    userId: user._id.toString(),
                    planName: plan.name,
                    planId: plan.id,
                }
            }
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('STRIPE CHECKOUT ERROR:', err);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
