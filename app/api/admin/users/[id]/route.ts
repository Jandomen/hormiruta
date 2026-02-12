import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: userId } = await params;

        await dbConnect();

        // 1. Delete all expenses related to this user
        await Expense.deleteMany({ driverId: userId });

        // 2. Delete all routes related to this user
        await Route.deleteMany({ userId: userId });

        // 3. Delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User and all associated data deleted successfully' });
    } catch (error) {
        console.error("[ADMIN_DELETE_USER] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
// Force update comment: 2026-02-03-19-33
