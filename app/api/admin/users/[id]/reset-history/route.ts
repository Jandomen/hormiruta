import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

const DEFAULTS = {
    vehicleType: 'truck',
    preferredMapApp: null,
    sosContact: null,
    lastLocation: null,
    plan: 'free',
    subscriptionStatus: 'none',
    subscriptionExpiry: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
};

export async function POST(
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

        const [routeResult, expenseResult, user] = await Promise.all([
            Route.deleteMany({ userId }),
            Expense.deleteMany({ driverId: userId }),
            User.findByIdAndUpdate(userId, {
                $set: {
                    vehicleType: DEFAULTS.vehicleType,
                    plan: DEFAULTS.plan,
                    subscriptionStatus: DEFAULTS.subscriptionStatus,
                },
                $unset: {
                    preferredMapApp: '',
                    sosContact: '',
                    lastLocation: '',
                    subscriptionExpiry: '',
                    stripeCustomerId: '',
                    stripeSubscriptionId: '',
                },
            }, { new: true, select: '-password' }),
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Historial restablecido con éxito. El usuario encontrará la app como nueva.',
            deletedRoutes: routeResult.deletedCount,
            deletedExpenses: expenseResult.deletedCount,
        });
    } catch (error) {
        console.error("[ADMIN_RESET_HISTORY] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
