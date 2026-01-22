import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Security check: Only existing admins can create new admins
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
        }

        const { name, email, password } = await req.json();

        if (!email || !password || password.length < 6) {
            return NextResponse.json({ message: 'Datos incompletos o contraseña muy corta' }, { status: 400 });
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'Este correo ya está registrado' }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        await User.create({
            name: name || 'Nuevo Administrador',
            email,
            password: hashedPassword,
            role: 'admin'
        });

        return NextResponse.json({ message: 'Nuevo administrador creado con éxito' }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
