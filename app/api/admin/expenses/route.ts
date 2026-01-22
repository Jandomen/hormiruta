import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
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

        const expenses = await Expense.find()
            .populate('driverId', 'name email')
            .sort({ date: -1 });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("[ADMIN_EXPENSES] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
