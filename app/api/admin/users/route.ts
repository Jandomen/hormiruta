import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        await dbConnect();

        const filter = query
            ? {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            }
            : {};

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[ADMIN_USERS] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
