import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import Route from '@/app/models/Route';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();
        const route = await Route.findOne({
            _id: params.id,
            userId: (session.user as any).id
        });

        if (!route) {
            return NextResponse.json({ message: 'Ruta no encontrada' }, { status: 404 });
        }

        return NextResponse.json(route);
    } catch (error: any) {
        console.error('Error fetching route:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();
        const result = await Route.deleteOne({
            _id: params.id,
            userId: (session.user as any).id
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: 'Ruta no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Ruta eliminada' });
    } catch (error: any) {
        console.error('Error deleting route:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
