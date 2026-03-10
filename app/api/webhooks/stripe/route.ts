import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { headers } from 'next/headers';
import Stripe from 'stripe';

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
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;
            const userId = metadata?.userId;
            const planName = metadata?.planName;

            if (userId) {
                await dbConnect();

                const planValue = planName?.toLowerCase() === 'flotilla' ? 'fleet' : 'premium';

                // Get the subscription ID if it exists (mode: subscription)
                const subscriptionId = session.subscription as string;

                await User.findByIdAndUpdate(userId, {
                    $set: {
                        plan: planValue,
                        subscriptionStatus: 'active',
                        stripeSubscriptionId: subscriptionId,
                        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days as buffer
                    }
                });
                console.log(`Subscription activated for UserID: ${userId} with plan ${planValue}`);
            }
            break;

        case 'customer.subscription.updated':
            const updatedSub = event.data.object as Stripe.Subscription;
            const userUpdate = await User.findOne({ stripeSubscriptionId: updatedSub.id });

            if (userUpdate) {
                const isExpired = ['incomplete_expired', 'past_due', 'canceled', 'unpaid', 'incomplete'].includes(updatedSub.status);
                const isTrial = updatedSub.status === 'trialing';

                await User.findByIdAndUpdate(userUpdate._id, {
                    $set: {
                        subscriptionStatus: isExpired ? 'expired' : (isTrial ? 'trialing' : 'active'),
                        // Stripe provides current_period_end in seconds
                        subscriptionExpiry: new Date((updatedSub as any)['current_period_end'] * 1000)
                    }
                });
                console.log(`Subscription updated for StripeSub: ${updatedSub.id}. Status: ${updatedSub.status}`);
            }
            break;

        case 'customer.subscription.deleted':
            const deletedSub = event.data.object as Stripe.Subscription;
            await User.findOneAndUpdate(
                { stripeSubscriptionId: deletedSub.id },
                {
                    $set: {
                        plan: 'free',
                        subscriptionStatus: 'none',
                    }
                }
            );
            console.log(`Subscription deleted: ${deletedSub.id}`);
            break;
    }

    return NextResponse.json({ received: true });
}
