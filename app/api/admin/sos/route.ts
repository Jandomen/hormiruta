import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import SOSAlert from '@/app/models/SOSAlert';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const alerts = await SOSAlert.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json(alerts);
    } catch (error) {
        console.error('[ADMIN_SOS] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
