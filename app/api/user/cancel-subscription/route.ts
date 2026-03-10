import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { stripe } from '../../../lib/stripe';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();

        // Find user in DB to get their Stripe Subscription ID
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const subscriptionId = user.stripeSubscriptionId;

        if (subscriptionId) {
            // Cancel the subscription in Stripe at the end of the current period
            // This is safer as they already paid for the full month
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });

            // Note: We don't update the plan to 'free' yet here. 
            // We wait for the Stripe Webhook 'customer.subscription.deleted' 
            // which fires when the period officially ends.
            // But we can mark it as 'canceling' in our DB if we want.

            await User.findByIdAndUpdate(user._id, {
                $set: {
                    subscriptionStatus: 'expired', // Or 'canceling' if we had that enum
                    canceledAt: new Date()
                }
            });

            return NextResponse.json({
                message: 'Tu suscripción será cancelada al finalizar el periodo actual. Seguirás teniendo acceso Premium hasta entonces.',
                status: 'canceling'
            });
        } else {
            // If No Stripe ID, just downgrade locally (for older users or manual plans)
            await User.findByIdAndUpdate(user._id, {
                $set: {
                    plan: 'free',
                    subscriptionStatus: 'none',
                    canceledAt: new Date()
                }
            });

            return NextResponse.json({
                message: 'Suscripción cancelada correctamente.',
                plan: 'free'
            });
        }

    } catch (error: any) {
        console.error('SERVER CANCEL SUBSCRIPTION ERROR:', error);
        return NextResponse.json({
            error: error.message || 'Error al procesar la cancelación'
        }, { status: 500 });
    }
}
