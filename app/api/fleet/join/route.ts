import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Fleet from '@/app/models/Fleet';
import { getPlanMaxMembers } from '@/app/lib/plan';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { code } = await req.json();
        if (!code || typeof code !== 'string') {
            return NextResponse.json({ error: 'Código de invitación requerido' }, { status: 400 });
        }

        const cleanCode = code.trim().toUpperCase();

        await dbConnect();

        const user = (await User.findOne({ email: session.user.email }).lean()) as any;
        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const fleet = (await Fleet.findOne({ inviteCode: cleanCode }).lean()) as any;
        if (!fleet) {
            return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
        }

        const expires = fleet.inviteCodeExpires ? new Date(fleet.inviteCodeExpires).getTime() : 0;
        if (!expires || expires < Date.now()) {
            return NextResponse.json({ error: 'El código de invitación expiró. Pide uno nuevo.' }, { status: 410 });
        }

        if (fleet.ownerId.toString() === user._id.toString()) {
            return NextResponse.json({ error: 'Eres el dueño de esta flotilla' }, { status: 400 });
        }

        const isMember = (fleet.memberIds || []).some((id: any) => id.toString() === user._id.toString());
        if (isMember) {
            return NextResponse.json({ error: 'Ya perteneces a esta flotilla' }, { status: 400 });
        }

        const owner = (await User.findById(fleet.ownerId).lean()) as any;
        const maxMembers = await getPlanMaxMembers(owner);
        if (maxMembers > 0 && (fleet.memberIds || []).length >= maxMembers) {
            return NextResponse.json({
                error: `La flotilla llegó a su límite de ${maxMembers} choferes. Pide al dueño que quite a alguien para unirte.`,
            }, { status: 403 });
        }

        await Fleet.updateOne(
            { _id: fleet._id },
            { $addToSet: { memberIds: user._id } }
        );

        return NextResponse.json({
            success: true,
            fleetName: fleet.name,
            message: `Te uniste a la flotilla "${fleet.name}"`,
        });
    } catch (error) {
        console.error('[API_FLEET_JOIN] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
