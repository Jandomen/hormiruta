import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const [userCount, routeCount, expenseCount, totalExpenses, expenseBreakdown] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Route.countDocuments(),
            Expense.countDocuments(),
            Expense.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Expense.aggregate([
                { $group: { _id: "$type", total: { $sum: "$amount" } } }
            ])
        ]);

        const totalSpent = totalExpenses[0]?.total || 0;
        const breakdown = expenseBreakdown.reduce((acc: any, curr: any) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        // Get active users (who have routes updated recently - simplification)
        const activeUsersCount = await User.countDocuments({
            role: 'user',
            // Here you could add a 'lastActive' field later, for now just use count
        });

        return NextResponse.json({
            users: userCount,
            routes: routeCount,
            expenses: expenseCount,
            totalSpent,
            breakdown
        });
    } catch (error) {
        console.error("[ADMIN_STATS] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
