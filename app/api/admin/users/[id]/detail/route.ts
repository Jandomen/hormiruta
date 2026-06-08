import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET(
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

        const [user, routes, expenses] = await Promise.all([
            User.findById(userId).select('-password'),
            Route.find({ userId }).sort({ date: -1 }),
            Expense.find({ driverId: userId }).sort({ date: -1 }),
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const completedRoutes = routes.filter(r => r.status === 'completed').length;

        return NextResponse.json({
            user,
            routes,
            expenses,
            summary: {
                totalRoutes: routes.length,
                completedRoutes,
                totalExpenses: expenses.length,
                totalSpent,
            }
        });
    } catch (error) {
        console.error("[ADMIN_USER_DETAIL] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
