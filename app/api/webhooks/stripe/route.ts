import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { headers } from 'next/headers';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing');
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook Error: ${errorMessage}`);
        return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const email = paymentIntent.metadata.email;
        const planName = paymentIntent.metadata.planName;

        if (email) {
            await dbConnect();

            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);

            await User.findOneAndUpdate(
                { email },
                {
                    $set: {
                        plan: planName?.toLowerCase() === 'flotilla' ? 'fleet' : 'premium',
                        subscriptionStatus: 'active',
                        subscriptionExpiry: expiryDate,
                        lastPaymentId: paymentIntent.id
                    }
                }
            );

            console.log(`Subscription activated for ${email} with plan ${planName}`);
        }
    }

    return NextResponse.json({ received: true });
}

