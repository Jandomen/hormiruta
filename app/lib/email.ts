import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@hormiruta.app',
        to,
        subject: 'Recuperación de contraseña - HormiRuta',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b1121; border-radius: 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <img src="https://hormiruta.app/LogoHormiruta.png" alt="HormiRuta" style="width: 64px; height: 64px;" />
                    <h1 style="color: #fff; font-size: 24px; margin: 16px 0 4px;">Recupera tu acceso</h1>
                    <p style="color: rgba(255,255,255,0.4); font-size: 14px;">Haz clic en el botón para restablecer tu contraseña</p>
                </div>
                <a href="${resetUrl}" style="display: block; text-align: center; padding: 16px 32px; background: #2563EB; color: #fff; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 14px; margin: 24px 0;">
                    Restablecer contraseña
                </a>
                <p style="color: rgba(255,255,255,0.3); font-size: 12px; text-align: center;">Este enlace expira en 1 hora.</p>
                <p style="color: rgba(255,255,255,0.2); font-size: 11px; text-align: center;">Si no solicitaste esto, ignora este mensaje.</p>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 24px 0;" />
                <p style="color: rgba(255,255,255,0.15); font-size: 10px; text-align: center;">HormiRuta © ${new Date().getFullYear()}</p>
            </div>
        `,
    });
}
