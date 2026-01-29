import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Security check: Only admins can update their profile here
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const { currentEmail, newEmail, newPassword, newName } = await req.json();

        await dbConnect();

        const user = await User.findOne({ email: session.user?.email });
        if (!user) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        // Update fields if provided
        if (newName) user.name = newName;
        if (newEmail && newEmail !== user.email) {
            const emailExists = await User.findOne({ email: newEmail });
            if (emailExists) {
                return NextResponse.json({ message: 'El nuevo correo ya está en uso' }, { status: 400 });
            }
            user.email = newEmail;
        }
        if (newPassword) {
            if (newPassword.length < 6) {
                return NextResponse.json({ message: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
            }
            user.password = await hash(newPassword, 12);
        }

        await user.save();

        return NextResponse.json({ message: 'Perfil actualizado con éxito' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
