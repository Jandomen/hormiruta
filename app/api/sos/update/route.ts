import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { sosContact } = await req.json();

        if (!sosContact) {
            return NextResponse.json({ error: "Número de contacto requerido" }, { status: 400 });
        }

        // Basic phone number validation (simple check for now)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(sosContact)) {
            return NextResponse.json({ error: "Formato de número inválido" }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findByIdAndUpdate(
            (session.user as any).id,
            { sosContact },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Contacto SOS actualizado correctamente",
            sosContact: user.sosContact
        });

    } catch (error) {
        console.error("[API_SOS_UPDATE_ERROR]", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
