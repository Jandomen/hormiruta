import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Fleet from '@/app/models/Fleet';
import { isFleetActive } from '@/app/lib/plan';

async function getOwnerFleet(sessionEmail: string) {
    await dbConnect();

    const owner = (await User.findOne({ email: sessionEmail }).lean()) as any;
    if (!owner) {
        return { error: 'Usuario no encontrado', status: 404 };
    }

    if (!await isFleetActive(owner)) {
        return { error: 'El plan Flotilla es requerido', status: 403 };
    }

    const fleet = (await Fleet.findOneAndUpdate(
        { ownerId: owner._id },
        { $setOnInsert: { name: 'Mi Flotilla', createdAt: new Date() } },
        { new: true, upsert: true }
    )) as any;

    return { owner, fleet };
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { email, query } = await req.json();
        const search = (query || email || '').trim();

        if (!search) {
            return NextResponse.json({ error: 'Ingresa el nombre o correo del chofer' }, { status: 400 });
        }

        const { error, status, owner, fleet } = await getOwnerFleet(session.user.email);
        if (error) {
            return NextResponse.json({ error }, { status });
        }

        const looksLikeEmail = search.includes('@');

        let member: any = null;
        if (looksLikeEmail) {
            member = await User.findOne({ email: search.toLowerCase() }).select('_id name email').lean();
            if (!member) {
                return NextResponse.json({ error: 'No existe un usuario con ese correo' }, { status: 404 });
            }
        } else {
            const nameRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            const matches = await User.find({ name: nameRegex }).select('_id name email').limit(5).lean();
            if (matches.length === 0) {
                return NextResponse.json({ error: 'No existe un usuario con ese nombre' }, { status: 404 });
            }
            if (matches.length > 1) {
                return NextResponse.json({ error: `Hay ${matches.length} usuarios con ese nombre. Usa el correo para precisar.` }, { status: 400 });
            }
            member = matches[0];
        }

        const memberId = member._id.toString();
        if (memberId === owner._id.toString()) {
            return NextResponse.json({ error: 'No puedes agregarte a ti mismo' }, { status: 400 });
        }

        const alreadyInFleet = fleet.memberIds.some((id: any) => id.toString() === memberId);
        if (alreadyInFleet) {
            return NextResponse.json({ error: 'El usuario ya pertenece a tu flotilla' }, { status: 400 });
        }

        fleet.memberIds.push(member._id);
        fleet.updatedAt = new Date();
        await fleet.save();

        return NextResponse.json({
            member: {
                id: member._id.toString(),
                name: (member as any).name || '',
                email: member.email,
            },
        });
    } catch (error) {
        console.error('[API_FLEET_MEMBERS_POST] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { memberId } = await req.json();

        if (!memberId) {
            return NextResponse.json({ error: 'memberId requerido' }, { status: 400 });
        }

        const { error, status, fleet } = await getOwnerFleet(session.user.email);
        if (error) {
            return NextResponse.json({ error }, { status });
        }

        fleet.memberIds = fleet.memberIds.filter((id: any) => id.toString() !== memberId);
        fleet.updatedAt = new Date();
        await fleet.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API_FLEET_MEMBERS_DELETE] Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
