import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Pricing from '@/app/models/Pricing';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

const DEFAULT_PLANS = [
    {
        id: 'premium',
        name: 'Premium',
        price: 199,
        currency: 'MXN',
        trialDays: 7,
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
        description: 'Para profesionales que buscan máxima eficiencia.',
        features: [
            'Paradas ilimitadas',
            'Optimización con Tráfico Real',
            'Historial completo de rutas',
            'Soporte prioritario 24/7',
            'Modo OVNI exclusivo',
        ],
        highlight: true,
        active: true,
        order: 1,
        color: 'from-info via-blue-500 to-indigo-600',
        cta: 'Prueba 7 días gratis',
        ctaLink: '',
    },
    {
        id: 'fleet',
        name: 'Flotilla',
        price: 899,
        currency: 'MXN',
        trialDays: 0,
        stripePriceId: process.env.STRIPE_FLEET_PRICE_ID || '',
        description: 'Control total de tu flota y choferes con planes a medida.',
        features: [
            'Precios especiales para flotillas',
            'Contratos por tiempo personalizado',
            'Monitoreo GPS en vivo de flota',
            'Reportes de rendimiento por chofer',
            'API para integraciones empresariales',
        ],
        highlight: false,
        active: true,
        order: 2,
        color: 'from-purple-500 to-pink-600',
        cta: 'Contactar Ventas',
        ctaLink: 'mailto:ventas@hormiruta.app',
    },
];

async function getPricingDocument() {
    await dbConnect();
    let pricing = await Pricing.findOne();
    if (!pricing) {
        pricing = await Pricing.create({ plans: DEFAULT_PLANS });
    } else if (!pricing.plans || pricing.plans.length === 0) {
        const raw = pricing.toObject ? pricing.toObject() : pricing;
        const oldPremium = (raw as any).premium;
        const oldFleet = (raw as any).fleet;
        if (oldPremium || oldFleet) {
            pricing.plans = [
                {
                    ...DEFAULT_PLANS[0],
                    price: oldPremium?.price ?? DEFAULT_PLANS[0].price,
                    trialDays: oldPremium?.trialDays ?? DEFAULT_PLANS[0].trialDays,
                },
                {
                    ...DEFAULT_PLANS[1],
                    price: oldFleet?.price ?? DEFAULT_PLANS[1].price,
                    trialDays: oldFleet?.trialDays ?? DEFAULT_PLANS[1].trialDays,
                },
            ];
            await pricing.save();
        }
    }
    return pricing;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pricing = await getPricingDocument();
        return NextResponse.json(pricing);
    } catch (error) {
        console.error('[ADMIN_PRICING_GET] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const pricing = await getPricingDocument();

        const plan = {
            id: body.id || body.name?.toLowerCase().replace(/\s+/g, '-'),
            name: body.name || 'Nuevo Plan',
            price: body.price ?? 0,
            currency: body.currency || 'MXN',
            trialDays: body.trialDays ?? 0,
            stripePriceId: body.stripePriceId || '',
            description: body.description || '',
            features: Array.isArray(body.features) ? body.features : [],
            highlight: !!body.highlight,
            active: body.active !== undefined ? !!body.active : true,
            order: body.order ?? pricing.plans.length,
            color: body.color || 'from-blue-400 to-indigo-500',
        cta: body.cta || '',
        ctaLink: body.ctaLink || '',
        serviceTime: body.serviceTime ?? 5,
    };

    pricing.plans.push(plan);
        pricing.updatedAt = new Date();
        await pricing.save();

        return NextResponse.json(pricing);
    } catch (error) {
        console.error('[ADMIN_PRICING_POST] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const pricing = await getPricingDocument();

        const index = pricing.plans.findIndex((p: any) => p.id === body.id);
        if (index === -1) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        const existing = pricing.plans[index];
        if (body.name !== undefined) existing.name = body.name;
        if (body.price !== undefined) existing.price = body.price;
        if (body.currency !== undefined) existing.currency = body.currency;
        if (body.trialDays !== undefined) existing.trialDays = body.trialDays;
        if (body.stripePriceId !== undefined) existing.stripePriceId = body.stripePriceId;
        if (body.description !== undefined) existing.description = body.description;
        if (body.features !== undefined) existing.features = Array.isArray(body.features) ? body.features : [];
        if (body.highlight !== undefined) existing.highlight = !!body.highlight;
        if (body.active !== undefined) existing.active = !!body.active;
        if (body.order !== undefined) existing.order = body.order;
        if (body.color !== undefined) existing.color = body.color;
        if (body.cta !== undefined) existing.cta = body.cta;
        if (body.ctaLink !== undefined) existing.ctaLink = body.ctaLink;
        if (body.serviceTime !== undefined) existing.serviceTime = body.serviceTime;

        pricing.updatedAt = new Date();
        await pricing.save();

        return NextResponse.json(pricing);
    } catch (error) {
        console.error('[ADMIN_PRICING_PUT] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const pricing = await getPricingDocument();

        const index = pricing.plans.findIndex((p: any) => p.id === body.id);
        if (index === -1) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        pricing.plans.splice(index, 1);
        pricing.updatedAt = new Date();
        await pricing.save();

        return NextResponse.json(pricing);
    } catch (error) {
        console.error('[ADMIN_PRICING_DELETE] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
