import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Fleet from '@/app/models/Fleet';
import { isFleetActive } from '@/app/lib/plan';

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();

        const owner = (await User.findOne({ email: session.user.email }).lean()) as any;
        if (!owner) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (!await isFleetActive(owner)) {
            return NextResponse.json({ error: 'El plan Flotilla es requerido' }, { status: 403 });
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const fleet = await Fleet.findOneAndUpdate(
            { ownerId: owner._id },
            { $set: { inviteCode: code, inviteCodeExpires: expiresAt, updatedAt: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ) as any;

        return NextResponse.json({
            code: (fleet as any).inviteCode,
            expiresAt: (fleet as any).inviteCodeExpires,
        });
    } catch (error) {
        console.error('[API_FLEET_INVITE] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
