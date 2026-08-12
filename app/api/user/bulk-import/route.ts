import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { isProUser } from '@/app/lib/plan';

const FREE_BULK_IMPORT_LIMIT = 15;

function currentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email }).lean();

        if (isProUser(user)) {
            return NextResponse.json({ unlimited: true });
        }

        const period = currentPeriod();
        const used = (user as any)?.bulkImportPeriod === period
            ? ((user as any)?.bulkImportsUsed || 0)
            : 0;
        const remaining = Math.max(0, FREE_BULK_IMPORT_LIMIT - used);
        return NextResponse.json({ unlimited: false, used, remaining, limit: FREE_BULK_IMPORT_LIMIT, period });
    } catch (error) {
        console.error('[API_BULK_IMPORT_GET] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email }).lean();

        if (isProUser(user)) {
            return NextResponse.json({ allowed: true, unlimited: true });
        }

        const period = currentPeriod();

        // Reset automático del contador al cambiar de mes calendario.
        await User.updateOne(
            { email: session.user.email, bulkImportPeriod: { $ne: period } },
            { $set: { bulkImportsUsed: 0, bulkImportPeriod: period } }
        );

        // Incremento atómico: solo consume si quedan intentos este mes
        const consumed = await User.findOneAndUpdate(
            { email: session.user.email, bulkImportsUsed: { $lt: FREE_BULK_IMPORT_LIMIT } },
            { $inc: { bulkImportsUsed: 1 }, $set: { bulkImportPeriod: period } },
            { new: true }
        );

        if (!consumed) {
            return NextResponse.json({
                allowed: false,
                remaining: 0,
                message: `Has alcanzado el límite de ${FREE_BULK_IMPORT_LIMIT} cargas masivas este mes en el plan gratuito. ¡Upgrada para importar sin límites!`,
            }, { status: 403 });
        }

        const used = (consumed as any).bulkImportsUsed || 0;
        return NextResponse.json({ allowed: true, used, remaining: Math.max(0, FREE_BULK_IMPORT_LIMIT - used), limit: FREE_BULK_IMPORT_LIMIT, period });
    } catch (error) {
        console.error('[API_BULK_IMPORT_POST] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
