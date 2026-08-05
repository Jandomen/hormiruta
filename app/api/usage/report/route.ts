import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import UsageLog from '@/app/models/UsageLog';

const VALID_TYPES = ['map_load', 'directions', 'geocoding'];

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { type } = await req.json();
        if (!VALID_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
        }

        await dbConnect();

        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const field = type === 'map_load' ? 'mapLoads' : type === 'directions' ? 'directions' : 'geocoding';

        await UsageLog.findOneAndUpdate(
            { month },
            {
                $inc: { [field]: 1 },
                $set: { updatedAt: now },
                $setOnInsert: { month, createdAt: now },
            },
            { upsert: true }
        );

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[USAGE] Error:', err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
