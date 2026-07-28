import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { name, email } = await req.json();

        await dbConnect();

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined && email !== session.user.email) {
            const existing = await User.findOne({ email });
            if (existing) {
                return NextResponse.json({ error: 'El correo ya está registrado por otro usuario' }, { status: 409 });
            }
            updateData.email = email;
        }

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Perfil actualizado', user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('[API_USER_PROFILE] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
