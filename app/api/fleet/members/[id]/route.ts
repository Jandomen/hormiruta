import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Fleet from '@/app/models/Fleet';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { isFleetActive } from '@/app/lib/plan';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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

        if (!await isFleetActive(owner)) {
            return NextResponse.json({ error: 'El plan Flotilla es requerido' }, { status: 403 });
        }

        const memberId = params.id;
        const fleet = (await Fleet.findOne({ ownerId: owner._id }).lean()) as any;
        if (!fleet || !fleet.memberIds?.length) {
            return NextResponse.json({ error: 'Flotilla vacía' }, { status: 404 });
        }

        const isMember = fleet.memberIds.some((id: any) => id.toString() === memberId);
        if (!isMember) {
            return NextResponse.json({ error: 'El usuario no pertenece a tu flotilla' }, { status: 403 });
        }

        const member = (await User.findById(memberId)
            .select('_id name email vehicleType lastLocation locationHistory')
            .lean()) as any;
        if (!member) {
            return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
        }

        const now = new Date();

        const url = new URL(req.url);
        const period = url.searchParams.get('period') || 'day';
        if (!['day', 'week', 'month'].includes(period)) {
            return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
        }

        let startDate: Date;
        if (period === 'day') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === 'week') {
            const mondayOffset = (now.getDay() + 6) % 7;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const routes = (await Route.find({
            userId: member._id,
            date: { $gte: startDate },
        }).lean()) as any[];

        let completedStops = 0;
        let failedStops = 0;
        let totalDistance = 0;
        routes.forEach((r: any) => {
            (r.stops || []).forEach((s: any) => {
                if (s.isCompleted) completedStops++;
                if (s.isFailed) failedStops++;
            });
            totalDistance += r.totalDistance || 0;
        });

        const expenses = (await Expense.find({
            driverId: member._id,
            date: { $gte: startDate },
        }).lean()) as any[];

        const expenseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const resolvedStops = completedStops + failedStops;
        const successRate = resolvedStops === 0
            ? null
            : Math.round((completedStops / resolvedStops) * 100);

        const lastUpdate = (member as any).lastLocation?.updatedAt
            ? new Date((member as any).lastLocation.updatedAt).getTime()
            : null;

        const isActive = lastUpdate !== null && now.getTime() - lastUpdate < 10 * 60 * 1000;

        const history = ((member as any).locationHistory || []) as { lat: number; lng: number; t?: Date }[];
        const trajectory = history.slice(-60).map(p => ({
            lat: p.lat,
            lng: p.lng,
            t: p.t ? new Date(p.t).getTime() : null,
        }));

        return NextResponse.json({
            member: {
                id: member._id.toString(),
                name: member.name || '',
                email: member.email,
                vehicleType: (member as any).vehicleType || 'truck',
                lastLocation: (member as any).lastLocation || null,
            },
            trajectory,
            isActive,
            period,
            stats: {
                routes: routes.length,
                completedStops,
                failedStops,
                totalDistance,
                expenses: expenses.length,
                expenseTotal,
                successRate,
            },
        });
    } catch (error) {
        console.error('[API_FLEET_MEMBER_DETAIL] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

const VEHICLE_TYPES = ['car', 'truck', 'van', 'motorcycle', 'pickup', 'ufo'];

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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

        if (!await isFleetActive(owner)) {
            return NextResponse.json({ error: 'El plan Flotilla es requerido' }, { status: 403 });
        }

        const memberId = params.id;
        const fleet = (await Fleet.findOne({ ownerId: owner._id }).lean()) as any;
        if (!fleet || !fleet.memberIds?.length) {
            return NextResponse.json({ error: 'Flotilla vacía' }, { status: 404 });
        }

        const isMember = fleet.memberIds.some((id: any) => id.toString() === memberId);
        if (!isMember) {
            return NextResponse.json({ error: 'El usuario no pertenece a tu flotilla' }, { status: 403 });
        }

        const { vehicleType } = await req.json();
        if (!vehicleType || !VEHICLE_TYPES.includes(vehicleType)) {
            return NextResponse.json({ error: 'Tipo de vehículo inválido' }, { status: 400 });
        }

        await User.findByIdAndUpdate(memberId, { $set: { vehicleType } });

        return NextResponse.json({ success: true, vehicleType });
    } catch (error) {
        console.error('[API_FLEET_MEMBER_PATCH] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
