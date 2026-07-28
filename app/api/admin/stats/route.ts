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

        const [
            userCount, routeCount, expenseCount, totalExpenses, expenseBreakdown,
            activeSubs, trialingSubs, expiredSubs, cancelledSubs, freeUsers, sosCount
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Route.countDocuments(),
            Expense.countDocuments(),
            Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
            Expense.aggregate([{ $group: { _id: "$type", total: { $sum: "$amount" } } }]),
            User.countDocuments({ role: 'user', subscriptionStatus: 'active', plan: { $ne: 'free' } }),
            User.countDocuments({ role: 'user', subscriptionStatus: 'trialing', plan: { $ne: 'free' } }),
            User.countDocuments({ role: 'user', subscriptionStatus: 'expired' }),
            User.countDocuments({ role: 'user', subscriptionStatus: 'cancelled' }),
            User.countDocuments({ role: 'user', plan: 'free' }),
            (await import('@/app/models/SOSAlert')).default.countDocuments(),
        ]);

        const totalSpent = totalExpenses[0]?.total || 0;
        const breakdown = expenseBreakdown.reduce((acc: any, curr: any) => {
            acc[curr._id] = curr.total;
            return acc;
        }, {});

        return NextResponse.json({
            users: userCount,
            routes: routeCount,
            expenses: expenseCount,
            totalSpent,
            breakdown,
            subscriptions: {
                active: activeSubs,
                trialing: trialingSubs,
                expired: expiredSubs,
                cancelled: cancelledSubs,
                free: freeUsers,
                total: userCount,
            },
            sosAlerts: sosCount,
        });
    } catch (error) {
        console.error("[ADMIN_STATS] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
