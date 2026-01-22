import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(req: Request) {
    try {
        const { message, location, driverName } = await req.json();

        const session = await getServerSession(authOptions);
        let toNumber = (session?.user as any)?.sosContact;

        // Limpiar y formatear el número para Twilio (E.164)
        if (toNumber) {
            toNumber = toNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
            if (!toNumber.startsWith('+')) {
                // Si son 10 dígitos, asumimos México (+52)
                if (toNumber.length === 10) {
                    toNumber = `+52${toNumber}`;
                } else if (!toNumber.startsWith('52')) {
                    // Si no empieza con 52 y no tiene +, agregamos +
                    toNumber = `+${toNumber}`;
                } else {
                    toNumber = `+${toNumber}`;
                }
            }
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !toNumber) {
            const missing = !toNumber ? 'Contacto SOS no configurado' : 'Configuración de Twilio incompleta';
            console.error(`[SOS] ${missing}`);
            return NextResponse.json({ error: missing }, { status: !toNumber ? 400 : 500 });
        }

        const sosMessage = `🚨 SOS HORMIRUTA: ${driverName} necesita ayuda. Ubicación: ${location}. Mensaje: ${message || 'Sin mensaje'}`;

        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: new URLSearchParams({
                From: fromNumber || '',
                To: toNumber,
                Body: sosMessage
            })
        });

        // Intentar realizar una llamada automática vía Twilio Voice
        try {
            await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                },
                body: new URLSearchParams({
                    From: fromNumber || '',
                    To: toNumber,
                    Twiml: `<Response><Say language="es-MX" voice="alice">Atención. Esta es una alerta de emergencia de Hormiruta. El conductor ${driverName} ha activado el botón de pánico y solicita ayuda inmediata. Por favor, revise su mensaje de texto para ver la ubicación. Repito, el conductor ${driverName} solicita auxilio inmediato.</Say></Response>`
                })
            });
            console.log(`[SOS] Llamada automática iniciada para ${toNumber}`);
        } catch (callError) {
            console.error('[SOS] Error al intentar realizar la llamada:', callError);
            // No detenemos el proceso si la llamada falla pero el SMS se envió
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al enviar SMS');
        }

        return NextResponse.json({ success: true, message: 'Alerta y llamada enviadas correctamente' });

    } catch (error: any) {
        console.error('[SOS ERROR]:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
