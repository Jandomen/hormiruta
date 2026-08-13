import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import Route from '@/app/models/Route';
import User from '@/app/models/User';
import { isProUser } from '@/app/lib/plan';

const FREE_STOP_LIMIT = 10;
const FREE_SAVED_ROUTE_LIMIT = 3;

async function enforceStopLimit(userId: string, stopCount: number) {
    if (stopCount <= FREE_STOP_LIMIT) return null;

    const user = await User.findById(userId);
    if (!user) return 'Usuario no encontrado';

    if (!isProUser(user)) {
        return `El plan gratuito tiene un límite de ${FREE_STOP_LIMIT} paradas por ruta. Actualiza tu plan para agregar más.`;
    }

    return null;
}

async function enforceSavedRouteLimit(userId: string) {
    const user = await User.findById(userId);
    if (!user) return 'Usuario no encontrado';

    if (isProUser(user)) return null;

    const count = await Route.countDocuments({ userId });
    if (count >= FREE_SAVED_ROUTE_LIMIT) {
        return `Has alcanzado el límite de ${FREE_SAVED_ROUTE_LIMIT} rutas guardadas del plan gratuito. Actualiza a Premium para historial completo.`;
    }

    return null;
}

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

        const error = await enforceStopLimit((session.user as any).id, stops.length);
        if (error) {
            return NextResponse.json({ message: error }, { status: 403 });
        }

        await dbConnect();

        const routeLimitError = await enforceSavedRouteLimit((session.user as any).id);
        if (routeLimitError) {
            return NextResponse.json({ message: routeLimitError }, { status: 403 });
        }

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

        const { id, stops, status, totalDistance, totalTime, name, date, isCompleted } = await req.json();

        if (!id) {
            return NextResponse.json({ message: 'ID de ruta requerido' }, { status: 400 });
        }

        if (stops) {
            const error = await enforceStopLimit((session.user as any).id, stops.length);
            if (error) {
                return NextResponse.json({ message: error }, { status: 403 });
            }
        }

        await dbConnect();

        const updateData: any = { updatedAt: new Date() };
        if (stops) updateData.stops = stops;
        if (status) updateData.status = status;
        if (isCompleted === true) updateData.status = 'completed';
        if (name !== undefined) updateData.name = name;
        if (date !== undefined) updateData.date = new Date(date);
        if (totalDistance !== undefined) updateData.totalDistance = totalDistance;
        if (totalTime !== undefined) updateData.totalTime = totalTime;

        const updatedRoute = await Route.findOneAndUpdate(
            { _id: id, userId: (session.user as any).id },
            { $set: updateData },
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
