import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        // Validate basic input
        if (!email || !password || password.length < 6) {
            return NextResponse.json(
                { message: 'Datos inválidos. Verifica tu correo y contraseña (min 6 caracteres).' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: 'Este correo ya está registrado.' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return NextResponse.json(
            { message: 'Usuario creado exitosamente', user: { id: user._id, email: user.email, name: user.name } },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { message: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
