import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Debes iniciar sesión para suscribirte' }, { status: 401 });
        }

        const { planName } = await req.json();

        // 1. Get or Create Customer
        await dbConnect();
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

        // 2. Define Price IDs based on plan
        // Nota: En producción, estos IDs vendrían de las variables de entorno o del dashboard de Stripe.
        const PRICE_IDS: Record<string, string | undefined> = {
            'Premium': process.env.STRIPE_PREMIUM_PRICE_ID, // Ejemplo: 'price_12345'
            'Flotilla': process.env.STRIPE_FLEET_PRICE_ID,
        };

        const priceId = PRICE_IDS[planName];

        if (!priceId) {
            return NextResponse.json({
                error: 'ID de precio no configurado para este plan. Por favor configura STRIPE_PREMIUM_PRICE_ID en Vercel.'
            }, { status: 400 });
        }

        // 3. Create Checkout Session
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
                planName: planName,
            },
            subscription_data: {
                trial_period_days: planName === 'Premium' ? 7 : 0, // 7 días gratis como dice la web
                metadata: {
                    userId: user._id.toString(),
                    planName: planName,
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
