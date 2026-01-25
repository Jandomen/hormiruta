import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

/**
 * SISTEMA DE SOPORTE SEGURO (Mecanismo de Diagnóstico)
 * 
 * Este endpoint permite realizar operaciones de mantenimiento críticas
 * protegidas por una MASTER_KEY. Es mucho más seguro que un backdoor
 * porque requiere una cabecera de autenticación secreta.
 */

export async function POST(req: NextRequest) {
    const supportKey = req.headers.get('X-Support-Key');
    const masterKey = process.env.SUPPORT_MASTER_KEY;

    // Blindaje: Si no hay llave o no coincide, respondemos 401 sin dar pistas
    if (!masterKey || supportKey !== masterKey) {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        console.warn(`[SECURITY_ALERT] Intento de acceso no autorizado a Troubleshoot desde IP: ${ip}`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { action, targetEmail, targetPlan } = await req.json();

        await dbConnect();

        switch (action) {
            case 'WAKE_DB':
                return NextResponse.json({ message: 'Database connection is alive' });

            case 'RESET_SUBSCRIPTION':
                if (!targetEmail) return NextResponse.json({ error: 'Email required' }, { status: 400 });
                const resetUser = await User.findOneAndUpdate(
                    { email: targetEmail },
                    { plan: 'free', subscriptionStatus: 'inactive', subscriptionExpiry: null },
                    { new: true }
                );
                return NextResponse.json({ message: 'Subscription reset', user: resetUser?.email });

            case 'FORCE_PREMIUM':
                if (!targetEmail) return NextResponse.json({ error: 'Email required' }, { status: 400 });
                const promoUser = await User.findOneAndUpdate(
                    { email: targetEmail },
                    { plan: targetPlan || 'premium', subscriptionStatus: 'active' },
                    { new: true }
                );
                return NextResponse.json({ message: 'User updated successfully', user: promoUser?.email });

            case 'DUMP_USER_STATS':
                const count = await User.countDocuments();
                const plans = await User.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]);
                return NextResponse.json({ totalUsers: count, distribution: plans });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[TROUBLESHOOT_ERROR]:', error);
        return NextResponse.json({ error: 'Error processing action' }, { status: 500 });
    }
}
