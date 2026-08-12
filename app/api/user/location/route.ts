import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Fleet from '@/app/models/Fleet';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { isFleetActive } from '@/app/lib/plan';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lat, lng, vehicleType } = await req.json();

        await dbConnect();

        const updateData: any = {
            lastLocation: {
                lat,
                lng,
                updatedAt: new Date()
            },
            $push: {
                locationHistory: {
                    $each: [{ lat, lng, t: new Date() }],
                    $slice: -120
                }
            }
        };

        if (vehicleType) {
            updateData.vehicleType = vehicleType;
        }

        await User.findByIdAndUpdate(
            (session.user as any).id,
            updateData
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[LOCATION_UPDATE_ERROR]:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const me = (await User.findOne({ email: session.user.email }).lean()) as any;
        if (!me) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const own = {
            id: me._id.toString(),
            name: (me as any).name || '',
            email: me.email,
            lastLocation: (me as any).lastLocation || null,
            vehicleType: (me as any).vehicleType || 'truck',
        };

        // Solo el plan Flotilla (o admin) puede ver ubicaciones de otros usuarios
        const isAdmin = (me as any).role === 'admin';
        if (!isAdmin && !isFleetActive(me)) {
            return NextResponse.json({ own, drivers: [] });
        }

        // Admin: mapa global de todos los usuarios activos en los últimos 10 minutos
        if (isAdmin) {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const drivers = (await User.find({
                'lastLocation.updatedAt': { $gte: tenMinutesAgo }
            }).select('_id name email lastLocation vehicleType').lean()) as any[];

            const formattedDrivers = drivers.map(d => ({
                ...d.toObject(),
                id: d._id.toString()
            }));

            return NextResponse.json({ own, drivers: formattedDrivers });
        }

        // Flotilla: solo los miembros de la flotilla del usuario
        const fleet = (await Fleet.findOne({ ownerId: me._id }).lean()) as any;
        if (!fleet || !fleet.memberIds?.length) {
            return NextResponse.json({ own, drivers: [] });
        }

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const drivers = (await User.find({
            _id: { $in: fleet.memberIds },
            'lastLocation.updatedAt': { $gte: tenMinutesAgo }
        }).select('_id name email lastLocation vehicleType').lean()) as any[];

        const formattedDrivers = drivers.map(d => ({
            ...d.toObject(),
            id: d._id.toString()
        }));

        return NextResponse.json({ own, drivers: formattedDrivers });
    } catch (error) {
        console.error("[LOCATION_GET_ERROR]:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
