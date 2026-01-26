import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(req: Request) {
    try {
        const { message, location, driverName } = await req.json();

        const session = await getServerSession(authOptions);
        let rawContacts = (session?.user as any)?.sosContact || '';

        // Soporte para múltiples contactos separados por comas
        const contactList = rawContacts.split(',').map((c: string) => {
            let num = c.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
            if (num && !num.startsWith('+')) {
                if (num.length === 10) num = `+52${num}`;
                else num = `+${num}`;
            }
            return num;
        }).filter(Boolean);

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || contactList.length === 0) {
            const missing = contactList.length === 0 ? 'Contacto SOS no configurado' : 'Configuración de Twilio incompleta';
            console.error(`[SOS] ${missing}`);
            return NextResponse.json({ error: missing }, { status: contactList.length === 0 ? 400 : 500 });
        }

        const sosMessage = `🚨 SOS HORMIRUTA: ${driverName} necesita ayuda. Ubicación: ${location}. Mensaje: ${message || 'Sin mensaje'}`;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        // Enviar a todos los contactos registrados
        const results = await Promise.all(contactList.map(async (toNumber: string) => {
            try {
                // SMS
                const smsRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
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

                // Voz
                await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${auth}`
                    },
                    body: new URLSearchParams({
                        From: fromNumber || '',
                        To: toNumber,
                        Twiml: `<Response><Say language="es-MX" voice="alice">Atención. Alerta de Hormiruta. El conductor ${driverName} solicita ayuda inmediata. Revise su ubicación por SMS.</Say></Response>`
                    })
                });

                return { toNumber, success: smsRes.ok };
            } catch (err) {
                console.error(`[SOS] Error enviando a ${toNumber}:`, err);
                return { toNumber, success: false };
            }
        }));

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('[SOS ERROR]:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
