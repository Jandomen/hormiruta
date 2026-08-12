import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Fleet from '@/app/models/Fleet';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { isFleetActive } from '@/app/lib/plan';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const s = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();

        const owner = (await User.findOne({ email: session.user.email }).lean()) as any;
        if (!owner) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (!isFleetActive(owner)) {
            return NextResponse.json({ error: 'El plan Flotilla es requerido' }, { status: 403 });
        }

        const fleet = (await Fleet.findOne({ ownerId: owner._id }).lean()) as any;

        if (!fleet) {
            return NextResponse.json({
                fleet: null,
                members: [],
                summary: {
                    totalMembers: 0,
                    activeCount: 0,
                    inRouteCount: 0,
                    inactiveCount: 0,
                    completedStopsToday: 0,
                    failedStopsToday: 0,
                    totalDistanceToday: 0,
                    expensesMonth: { count: 0, total: 0 },
                    outsideGeofence: 0,
                },
            });
        }

        const members = (await User.find({ _id: { $in: fleet.memberIds } })
            .select('_id name email vehicleType lastLocation')
            .lean()) as any[];

        const formattedMembers = members.map(m => ({
            id: m._id.toString(),
            name: m.name || '',
            email: m.email,
            vehicleType: (m as any).vehicleType || 'truck',
            lastLocation: (m as any).lastLocation || null,
        }));

        const geofence = (fleet as any).geofence || null;
        const nowMs = Date.now();
        const signalAge = (m: any) => {
            const u = m.lastLocation?.updatedAt;
            return u ? nowMs - new Date(u).getTime() : Infinity;
        };

        const withAlerts: Array<{ alert?: 'outside' | 'no-signal' | null } & (typeof formattedMembers)[number]> = formattedMembers.map(m => {
            const age = signalAge(m);
            let alert: 'outside' | 'no-signal' | null = null;
            if (age >= 10 * 60 * 1000) {
                alert = 'no-signal';
            } else if (geofence?.enabled && geofence.lat != null && geofence.lng != null && m.lastLocation) {
                const km = haversineKm(m.lastLocation.lat, m.lastLocation.lng, geofence.lat, geofence.lng);
                if (km > (geofence.radiusKm || 5)) alert = 'outside';
            }
            return alert ? { ...m, alert } : m;
        });

        // Resumen agregado de la flotilla (detalles del día y del mes)
        const memberIds = fleet.memberIds || [];
        const now = new Date();
        const activeThreshold = new Date(now.getTime() - 10 * 60 * 1000);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const activeCount = await User.countDocuments({
            _id: { $in: memberIds },
            'lastLocation.updatedAt': { $gte: activeThreshold },
        });

        const activeRoutesToday = await Route.find({
            userId: { $in: memberIds },
            date: { $gte: startOfToday },
            status: 'active',
        }).select('userId');

        const fleetMemberSet = new Set(memberIds.map((id: any) => id.toString()));
        const inRouteCount = new Set(activeRoutesToday
            .map((r: any) => r.userId?.toString())
            .filter((uid: string) => fleetMemberSet.has(uid))).size;

        const routesToday = await Route.find({
            userId: { $in: memberIds },
            date: { $gte: startOfToday },
        }).lean();

        let completedStopsToday = 0;
        let failedStopsToday = 0;
        let totalDistanceToday = 0;
        routesToday.forEach((r: any) => {
            (r.stops || []).forEach((s: any) => {
                if (s.isCompleted) completedStopsToday++;
                if (s.isFailed) failedStopsToday++;
            });
            totalDistanceToday += r.totalDistance || 0;
        });

        const expensesMonth = await Expense.aggregate([
            { $match: { driverId: { $in: memberIds }, date: { $gte: startOfMonth } } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
        ]);

        const outsideGeofence = withAlerts.filter(m => m.alert === 'outside').length;

        const summary = {
            totalMembers: memberIds.length,
            activeCount,
            inRouteCount,
            inactiveCount: Math.max(0, memberIds.length - activeCount),
            completedStopsToday,
            failedStopsToday,
            totalDistanceToday,
            expensesMonth: {
                count: expensesMonth[0]?.count || 0,
                total: expensesMonth[0]?.total || 0,
            },
            outsideGeofence,
        };

        return NextResponse.json({
            fleet: {
                id: fleet._id.toString(),
                name: fleet.name,
                geofence,
                inviteCode: (fleet as any).inviteCode || null,
                inviteCodeExpires: (fleet as any).inviteCodeExpires || null,
            },
            members: withAlerts,
            summary,
        });
    } catch (error) {
        console.error('[API_FLEET_GET] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { name, geofence } = await req.json();

        if (geofence !== undefined && typeof geofence !== 'object') {
            return NextResponse.json({ error: 'Geofence inválido' }, { status: 400 });
        }

        if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
            return NextResponse.json({ error: 'El nombre de la flotilla es requerido' }, { status: 400 });
        }

        const cleanName = name ? name.trim().slice(0, 60) : undefined;

        await dbConnect();

        const owner = (await User.findOne({ email: session.user.email }).lean()) as any;
        if (!owner) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (!isFleetActive(owner)) {
            return NextResponse.json({ error: 'El plan Flotilla es requerido' }, { status: 403 });
        }

        const setData: any = { updatedAt: new Date() };
        if (cleanName) setData.name = cleanName;

        if (geofence !== undefined) {
            const enabled = !!geofence.enabled;
            const lat = geofence.lat != null ? Number(geofence.lat) : null;
            const lng = geofence.lng != null ? Number(geofence.lng) : null;
            const radiusKm = Math.max(0.1, Number(geofence.radiusKm) || 5);
            const centerLabel = typeof geofence.centerLabel === 'string' ? geofence.centerLabel.slice(0, 80) : '';

            if (enabled && (lat == null || lng == null || isNaN(lat) || isNaN(lng))) {
                return NextResponse.json({ error: 'Centro de la zona inválido' }, { status: 400 });
            }

            setData.geofence = {
                enabled,
                lat: lat != null ? lat : null,
                lng: lng != null ? lng : null,
                radiusKm,
                centerLabel,
            };
        }

        const fleet = await Fleet.findOneAndUpdate(
            { ownerId: owner._id },
            { $set: setData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ) as any;

        return NextResponse.json({
            fleet: {
                id: fleet._id.toString(),
                name: fleet.name,
                geofence: (fleet as any).geofence || null,
            },
        });
    } catch (error) {
        console.error('[API_FLEET_POST] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
