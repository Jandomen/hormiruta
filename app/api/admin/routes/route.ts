import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Route from '@/app/models/Route';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        await dbConnect();

        const filter = userId ? { userId } : {};

        const routes = await Route.find(filter)
            .populate('userId', 'name email')
            .sort({ date: -1 });

        return NextResponse.json(routes);
    } catch (error) {
        console.error("[ADMIN_ROUTES] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
