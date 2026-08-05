import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import UsageLog from '@/app/models/UsageLog';

// Tarifas públicas de Google Maps Platform (USD por 1000 llamadas).
// Son estimaciones; el monto real lo cobra Google Cloud según contrato.
const RATES = {
    mapLoads: 7,
    directions: 5,
    geocoding: 5,
};

const FREE_CREDIT = 200;

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const now = new Date();
        const monthKeys: string[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const logs = await UsageLog.find({ month: { $in: monthKeys } }).lean();
        const byMonth = new Map<string, any>();
        for (const log of logs) {
            byMonth.set(log.month, log);
        }

        const monthly = monthKeys.map((month) => {
            const log: any = byMonth.get(month);
            const mapLoads = log?.mapLoads || 0;
            const directions = log?.directions || 0;
            const geocoding = log?.geocoding || 0;
            const estCost =
                (mapLoads * RATES.mapLoads) / 1000 +
                (directions * RATES.directions) / 1000 +
                (geocoding * RATES.geocoding) / 1000;
            return { month, mapLoads, directions, geocoding, estCost: Math.round(estCost * 100) / 100 };
        });

        const current = monthly[monthly.length - 1];
        const totalCalls = (current?.mapLoads || 0) + (current?.directions || 0);

        return NextResponse.json({
            freeCredit: FREE_CREDIT,
            rates: RATES,
            monthly,
            current: {
                ...current,
                totalCalls,
                usagePercent: current ? Math.min(100, ((current.estCost || 0) / FREE_CREDIT) * 100) : 0,
            },
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        console.error('[USAGE] Error:', err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
