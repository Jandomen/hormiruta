import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import Route from '@/app/models/Route';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();
        const routes = await Route.find({ userId: (session.user as any).id }).sort({ date: -1 });

        return NextResponse.json(routes);
    } catch (error: any) {
        console.error('Error fetching routes:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { name, date, stops, isOptimized, status, totalDistance, totalTime } = await req.json();

        if (!name || !date || !stops) {
            return NextResponse.json({ message: 'Datos incompletos' }, { status: 400 });
        }

        await dbConnect();

        const newRoute = await Route.create({
            userId: (session.user as any).id,
            name,
            date: new Date(date),
            stops,
            isOptimized: !!isOptimized,
            status: status || 'active',
            totalDistance: totalDistance || 0,
            totalTime: totalTime || ''
        });

        return NextResponse.json(newRoute, { status: 201 });
    } catch (error: any) {
        console.error('Error creating route:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        const { id, stops, status, totalDistance, totalTime } = await req.json();

        if (!id) {
            return NextResponse.json({ message: 'ID de ruta requerido' }, { status: 400 });
        }

        await dbConnect();

        const updatedRoute = await Route.findOneAndUpdate(
            { _id: id, userId: (session.user as any).id },
            {
                $set: {
                    stops,
                    status,
                    totalDistance,
                    totalTime
                }
            },
            { new: true }
        );

        if (!updatedRoute) {
            return NextResponse.json({ message: 'Ruta no encontrada' }, { status: 404 });
        }

        return NextResponse.json(updatedRoute);
    } catch (error: any) {
        console.error('Error updating route:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
