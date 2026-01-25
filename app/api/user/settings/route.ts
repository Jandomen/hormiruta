import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { preferredMapApp, vehicleType, sosContact } = body;

        await dbConnect();

        const updateData: any = {};
        if (preferredMapApp) updateData.preferredMapApp = preferredMapApp;
        if (vehicleType) updateData.vehicleType = vehicleType;
        if (sosContact) updateData.sosContact = sosContact;

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: updateData },
            { new: true }
        );

        return NextResponse.json({ message: 'Settings updated', user });
    } catch (error) {
        console.error('[API_USER_SETTINGS] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
