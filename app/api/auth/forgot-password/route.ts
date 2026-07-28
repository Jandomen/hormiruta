import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { sendPasswordResetEmail } from '@/app/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Correo electrónico requerido' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.' });
        }

        if (user.provider === 'google') {
            return NextResponse.json({ message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000);

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await user.save();

        try {
            await sendPasswordResetEmail(email, token);
        } catch (emailError) {
            console.error('[FORGOT_PASSWORD] Email send failed:', emailError);
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save();
            return NextResponse.json({ error: 'Error al enviar el correo. Verifica la configuración SMTP.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.' });
    } catch (error) {
        console.error('[FORGOT_PASSWORD] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
