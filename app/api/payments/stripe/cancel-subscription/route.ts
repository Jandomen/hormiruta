import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { stripe } from '@/app/lib/stripe';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Real Stripe cancellation if subscriptionId exists
        if (user.stripeSubscriptionId) {
            try {
                // Cancel at period end
                await stripe.subscriptions.update(user.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });
            } catch (err: any) {
                console.error("STRIPE SUBSCRIPTION CANCEL ERR:", err.message);
            }
        }

        // Update DB status to cancelled
        user.subscriptionStatus = 'cancelled';
        await user.save();

        return NextResponse.json({ 
            success: true, 
            message: 'Suscripción cancelada al final del periodo.' 
        });

    } catch (err: any) {
        console.error('SERVER STRIPE ERROR:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
