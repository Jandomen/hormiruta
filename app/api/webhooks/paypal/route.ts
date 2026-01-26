import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

async function getPayPalAccessToken() {
    const auth = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${process.env.NEXT_PUBLIC_PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const data = await response.json();
    return data.access_token;
}

export async function POST(req: NextRequest) {
    try {
        const { email, orderId, plan } = await req.json();

        if (!email || !orderId || !plan) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verificar el pago con PayPal directamente
        const accessToken = await getPayPalAccessToken();
        const paypalRes = await fetch(`${process.env.NEXT_PUBLIC_PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const orderData = await paypalRes.json();

        if (orderData.status !== 'COMPLETED') {
            return NextResponse.json({ error: 'Payment not completed or invalid' }, { status: 400 });
        }

        // 2. Si el pago es real, activar en la BD
        await dbConnect();

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        const updatedUser = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    plan: 'premium',
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
            message: 'Subscription activated securely',
            user: { email: updatedUser.email, plan: updatedUser.plan }
        });

    } catch (error) {
        console.error('PayPal Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
