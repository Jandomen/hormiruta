import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import Pricing from '@/app/models/Pricing';

const MIN_MXN = 10;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Debes iniciar sesión para suscribirte' }, { status: 401 });
        }

        const { planId, planName, mode } = await req.json();

        await dbConnect();

        const pricing = await Pricing.findOne();
        if (!pricing || !pricing.plans || pricing.plans.length === 0) {
            return NextResponse.json({ error: 'No hay planes configurados' }, { status: 400 });
        }

        const plan = pricing.plans.find(
            (p: any) => (planId && p.id === planId) || p.name === planName
        );
        if (!plan) {
            console.error(`[CHECKOUT] Plan no encontrado -> user=${session.user.email} planId=${planId} planName=${planName}`);
            return NextResponse.json({ error: `Plan "${planId || planName}" no encontrado` }, { status: 400 });
        }

        // Cobro directo en MXN desde el precio del plan (como jandosoft):
        // no se necesita configurar price IDs en Stripe, el monto se genera con price_data.
        const priceMxn = Number(plan.price) || 0;
        if (priceMxn <= 0) {
            return NextResponse.json({ error: 'Plan sin precio configurado' }, { status: 400 });
        }
        if (priceMxn < MIN_MXN) {
            return NextResponse.json({ error: `El monto mínimo de pago es $${MIN_MXN} pesos mexicanos.` }, { status: 400 });
        }

        const durationDays = Number(plan.durationDays) || 0;
        const isOneTime = durationDays > 0;

        let user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || '',
                metadata: {
                    userId: user._id.toString(),
                },
            });
            customerId = customer.id;
            user.stripeCustomerId = customerId;
            await user.save();
        }

        const appBaseUrl =
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const isEmbedded = mode === 'embedded';

        const lineItem: any = {
            quantity: 1,
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: `Plan ${plan.name} - HormiRuta`,
                    description: isOneTime ? `Acceso por ${durationDays} días` : undefined,
                },
                unit_amount: Math.round(priceMxn * 100),
            },
        };

        const checkoutConfig: any = {
            mode: isOneTime ? 'payment' : 'subscription',
            payment_method_types: ['card'],
            line_items: [lineItem],
            customer: customerId,
            ui_mode: isEmbedded ? 'embedded' : 'hosted',
            // EMBEDDED: return_url SIN {CHECKOUT_SESSION_ID} para que se ejecute el
            // onComplete del cliente (verify-checkout + cierre del modal). Si el
            // return_url trae el placeholder, Stripe redirige el iframe a esa URL y
            // onComplete NUNCA se llama (por eso tras pagar aparecía una pantalla
            // rara con texto y el plan no se reflejaba).
            return_url: isEmbedded ? `${appBaseUrl}/pricing?payment=success` : undefined,
            success_url: isEmbedded ? undefined : `${appBaseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: isEmbedded ? undefined : `${appBaseUrl}/pricing`,
            metadata: {
                userId: user._id.toString(),
                planId: plan.id,
                planName: plan.name,
                ...(isOneTime ? { durationDays: String(durationDays) } : {}),
            },
            // Marca oscura del checkout embebido/hosted. El iframe de Stripe no se
            // estiliza con CSS de la app: esto (o el Dashboard de Stripe) es la única vía.
            branding_settings: {
                display_name: 'HormiRuta',
                background_color: '#0a0a0a',
                button_color: '#60a5fa',
                border_style: 'rounded',
                font_family: 'inter',
            },
        };

        if (isOneTime) {
            // Copiamos la metadata al PaymentIntent: el webhook usa
            // payment_intent.succeeded como respaldo para activar planes flex
            // si checkout.session.completed no llega o va tarde.
            checkoutConfig.payment_intent_data = {
                metadata: {
                    userId: user._id.toString(),
                    planId: plan.id,
                    planName: plan.name,
                    durationDays: String(durationDays),
                    customerEmail: session.user.email,
                },
            };
        }

        if (!isOneTime) {
            lineItem.price_data.recurring = { interval: 'month' };
            if (plan.trialDays > 0) {
                checkoutConfig.subscription_data = {
                    trial_period_days: plan.trialDays,
                    metadata: {
                        userId: user._id.toString(),
                        planId: plan.id,
                        planName: plan.name,
                    },
                };
            } else {
                checkoutConfig.subscription_data = {
                    metadata: {
                        userId: user._id.toString(),
                        planId: plan.id,
                        planName: plan.name,
                    },
                };
            }
        }

        const checkoutSession = await stripe.checkout.sessions.create(checkoutConfig);

        console.log(`[CHECKOUT] Sesión creada -> user=${session.user.email} plan=${plan.name} mode=${checkoutSession.mode} id=${checkoutSession.id} mxn=${priceMxn} oneTime=${isOneTime}${isOneTime ? ` days=${durationDays}` : ''}`);

        if (isEmbedded) {
            // Checkout embebido: devolvemos el client_secret para que el
            // formulario de tarjeta se renderice dentro de la app.
            return NextResponse.json({ clientSecret: checkoutSession.client_secret });
        }

        return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('STRIPE CHECKOUT ERROR:', err);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
