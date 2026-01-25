import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
    try {
        const { email, orderId, plan } = await req.json();

        if (!email || !orderId || !plan) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Calcular fecha de expiración (1 mes desde hoy)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const updatedUser = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    plan: 'premium', // We map both paid plans to 'premium' internally for now
                    subscriptionStatus: 'active',
                    subscriptionExpiry: expiryDate,
                    lastPaymentId: orderId
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Subscription activated',
            user: {
                email: updatedUser.email,
                plan: updatedUser.plan
            }
        });

    } catch (error) {
        console.error('PayPal Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
