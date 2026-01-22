import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function GET() {
    try {
        await dbConnect();

        const adminEmail = 'admin@hormiruta.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            return NextResponse.json({ message: 'Administrador ya inicializado' }, { status: 200 });
        }

        const hashedPassword = await hash('admin123', 12);

        await User.create({
            name: 'Administrador Maestro',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });

        return NextResponse.json({
            message: 'Administrador inicializado con éxito',
            credentials: {
                email: 'admin@hormiruta.com',
                password: 'admin123'
            }
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
