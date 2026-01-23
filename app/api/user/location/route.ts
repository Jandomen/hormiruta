import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

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
