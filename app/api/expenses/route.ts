import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import Expense from '@/app/models/Expense';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const routeId = searchParams.get('routeId');

        await dbConnect();
        const filter = routeId
            ? { driverId: (session.user as any).id, routeId }
            : { driverId: (session.user as any).id };

        const expenses = await Expense.find(filter).sort({ date: -1 });

        return NextResponse.json(expenses);
    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { type, amount, description, routeId, date } = await req.json();

        if (!type || !amount) {
            return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 });
        }

        await dbConnect();

        const newExpense = await Expense.create({
            driverId: (session.user as any).id,
            routeId: routeId || 'NONE',
            type,
            amount,
            description,
            date: date ? new Date(date) : new Date()
        });

        return NextResponse.json(newExpense, { status: 201 });
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
