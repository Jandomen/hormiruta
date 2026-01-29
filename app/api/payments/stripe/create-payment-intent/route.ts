import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, planName } = await req.json();

        if (!amount || !planName) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects cents
            currency: 'mxn',
            metadata: {
                email: session.user.email || '',
                planName: planName,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('SERVER STRIPE ERROR:', {
            message: errorMessage,
            stack: err instanceof Error ? err.stack : undefined,
            envExists: !!process.env.STRIPE_SECRET_KEY
        });
        return NextResponse.json({
            error: errorMessage,
            details: "Please check Vercel environment variables and ensure STRIPE_SECRET_KEY is correct."
        }, { status: 500 });
    }
}
