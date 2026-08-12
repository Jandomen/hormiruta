import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Route from '@/app/models/Route';
import Expense from '@/app/models/Expense';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

const ALLOWED_UPDATES = [
    'plan', 'subscriptionStatus', 'role', 'vehicleType',
    'preferredMapApp', 'sosContact', 'name', 'adminGranted',
    'subscriptionExpiry', 'image'
];

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: userId } = await params;
        const body = await req.json();

        const updates: Record<string, any> = {};
        for (const key of ALLOWED_UPDATES) {
            if (body[key] !== undefined) {
                updates[key] = body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await dbConnect();

        const current = await User.findById(userId).select('plan subscriptionStatus subscriptionExpiry');
        const currentStatus = current?.subscriptionStatus || 'none';
        const currentExpiry = current?.subscriptionExpiry ? new Date(current.subscriptionExpiry).getTime() : null;

        // Al asignar un plan de pago desde admin, el estado debe quedar activo para que los gates
        // (isProUser/isFleetActive) lo reconozcan; de lo contrario la UI seguiría mostrando gratis.
        const targetPlan = updates.plan !== undefined ? updates.plan : (current?.plan || 'free');
        if (targetPlan === 'premium' || targetPlan === 'fleet') {
            if (updates.subscriptionStatus === undefined && currentStatus !== 'active' && currentStatus !== 'trialing') {
                updates.subscriptionStatus = 'active';
            }
            // Una expiración vieja (plan flex vencido) bajaría al usuario a free; se limpia salvo que el admin la envíe explícitamente.
            if (updates.subscriptionExpiry === undefined && currentExpiry !== null && currentExpiry < Date.now()) {
                updates.subscriptionExpiry = null;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, select: '-password' }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[ADMIN_UPDATE_USER] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

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
