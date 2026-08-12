import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import WebhookEvent from '@/app/models/WebhookEvent';
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

    await dbConnect();

    console.log(`[WEBHOOK] Evento recibido -> id=${event.id} type=${event.type}`);

    const alreadyProcessed = await WebhookEvent.findOne({ eventId: event.id });
    if (alreadyProcessed) {
        console.log(`[WEBHOOK] Event ${event.id} ya procesado. Ignorando duplicado.`);
        return NextResponse.json({ received: true, duplicate: true });
    }

    const handleSubscriptionUpdated = async (sub: Stripe.Subscription) => {
        const user = await User.findOne({ stripeSubscriptionId: sub.id });
        if (!user) {
            console.error(`[WEBHOOK] subscription.updated sin usuario -> stripeSub=${sub.id} status=${sub.status}`);
            return;
        }

        const isExpired = ['incomplete_expired', 'past_due', 'canceled', 'unpaid', 'incomplete'].includes(sub.status);
        const isTrial = sub.status === 'trialing';

        await User.findByIdAndUpdate(user._id, {
            $set: {
                subscriptionStatus: isExpired ? 'expired' : (isTrial ? 'trialing' : 'active'),
                subscriptionExpiry: new Date((sub as any).current_period_end * 1000),
            },
        });
    };

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;
            const userId = metadata?.userId;
            const planName = metadata?.planName;
            const planId = metadata?.planId;
            const customerEmail = metadata?.customerEmail || session.customer_details?.email || null;

            // Pago único (plan flex con duración): activar con expiración = now + durationDays.
            if (session.mode === 'payment' && planId && metadata?.durationDays) {
                const durationDays = parseInt(metadata.durationDays, 10) || 30;
                const planValue = planId === 'fleet' ? 'fleet' : 'premium';
                const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
                const updateData = {
                    plan: planValue,
                    subscriptionStatus: 'active',
                    subscriptionExpiry: periodEnd,
                    stripeSubscriptionId: (session.payment_intent as string) || '',
                    stripeCustomerId: (session.customer as string) || '',
                };

                let result = null;
                if (userId) {
                    result = await User.findByIdAndUpdate(userId, { $set: updateData });
                }
                if (!result && customerEmail) {
                    result = await User.findOneAndUpdate({ email: customerEmail }, { $set: updateData });
                }
                if (!result && session.customer) {
                    result = await User.findOneAndUpdate({ stripeCustomerId: session.customer as string }, { $set: updateData });
                }

                console.log(`[WEBHOOK] Flex plan activado -> ${result ? 'OK' : 'NOT FOUND'} plan=${planValue} days=${durationDays} user=${userId || customerEmail || session.customer}`);
                break;
            }

            const planValue = planId
                ? (planId === 'fleet' ? 'fleet' : 'premium')
                : (planName?.toLowerCase() === 'flotilla' ? 'fleet' : 'premium');

            // Get the subscription ID if it exists (mode: subscription)
            const subscriptionId = session.subscription as string;

            let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            let status = 'active';
            if (subscriptionId) {
                try {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);
                    periodEnd = new Date((sub as any).current_period_end * 1000);
                    status = sub.status;
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Unknown error';
                    console.error(`[WEBHOOK] Error retrieving subscription ${subscriptionId}:`, msg);
                }
            }

            const updateData = {
                plan: planValue,
                subscriptionStatus: status,
                stripeSubscriptionId: subscriptionId,
                subscriptionExpiry: periodEnd,
            };

            let result = null;
            if (userId) {
                result = await User.findByIdAndUpdate(userId, { $set: updateData });
            }
            if (!result && customerEmail) {
                result = await User.findOneAndUpdate({ email: customerEmail }, { $set: updateData });
            }
            if (!result && session.customer) {
                result = await User.findOneAndUpdate({ stripeCustomerId: session.customer as string }, { $set: updateData });
            }

            console.log(`[WEBHOOK] Checkout completed -> ${result ? 'OK' : 'NOT FOUND'} user=${userId || customerEmail || session.customer} plan=${planValue}`);
            break;

        case 'customer.subscription.created':
            const createdSub = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(createdSub);
            console.log(`[WEBHOOK] Subscription created for StripeSub: ${createdSub.id}. Status: ${createdSub.status}`);
            break;

        case 'customer.subscription.updated':
            const updatedSub = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(updatedSub);
            console.log(`Subscription updated for StripeSub: ${updatedSub.id}. Status: ${updatedSub.status}`);
            break;

        case 'customer.subscription.deleted':
            const deletedSub = event.data.object as Stripe.Subscription;
            const deletedResult = await User.findOneAndUpdate(
                { stripeSubscriptionId: deletedSub.id },
                {
                    $set: {
                        plan: 'free',
                        subscriptionStatus: 'none',
                    }
                }
            );
            console.log(`[WEBHOOK] Subscription deleted -> ${deletedSub.id} ${deletedResult ? 'OK' : 'SIN USUARIO'}`);
            break;

        case 'invoice.paid':
            const inv = event.data.object as Stripe.Invoice;
            const subId = (inv as any).subscription;
            if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                await handleSubscriptionUpdated(sub);
                console.log(`Invoice paid for StripeSub: ${subId}`);
            }
            break;

        case 'invoice.payment_failed':
            const failedInv = event.data.object as Stripe.Invoice;
            const failedSubId = (failedInv as any).subscription;
            if (failedSubId) {
                const failedResult = await User.updateOne(
                    { stripeSubscriptionId: failedSubId },
                    { $set: { subscriptionStatus: 'expired' } }
                );
                console.log(`[WEBHOOK] Invoice payment failed -> sub=${failedSubId} modified=${failedResult?.modifiedCount ?? '?'} (email: ${failedInv.customer_email || 'n/a'})`);
            }
            break;

        default:
            console.log(`[WEBHOOK] Evento no manejado -> type=${event.type}`);
            break;
    }

    try {
        await WebhookEvent.create({ eventId: event.id });
    } catch (err: any) {
        if (err?.code === 11000) {
            console.log(`[WEBHOOK] Event ${event.id} duplicado concurrente. Ignorando.`);
            return NextResponse.json({ received: true, duplicate: true });
        }
        console.error(`[WEBHOOK] Error registrando evento ${event.id}:`, err);
    }

    return NextResponse.json({ received: true });
}
