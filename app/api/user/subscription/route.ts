import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { isPlanExpired, planGrants } from '@/app/lib/plan';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email }).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const plan = (user as any).plan || 'free';
        const status = (user as any).subscriptionStatus || 'none';

        if (plan !== 'free' && (status === 'active' || status === 'trialing') && isPlanExpired(user)) {
            await User.updateOne(
                { email: session.user.email },
                { $set: { plan: 'free', subscriptionStatus: 'expired' } }
            );
        }

        const current = await User.findOne({ email: session.user.email }).lean();

        const g = await planGrants(current);

        return NextResponse.json({
            plan: (current as any).plan || 'free',
            subscriptionStatus: (current as any).subscriptionStatus || 'none',
            subscriptionExpiry: (current as any).subscriptionExpiry || null,
            adminGranted: !!(current as any).adminGranted,
            grantsPro: g.grantsPro,
            grantsFleet: g.grantsFleet,
        });
    } catch (error) {
        console.error('[API_USER_SUBSCRIPTION] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
