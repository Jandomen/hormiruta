import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Pricing from '@/app/models/Pricing';
import { DEFAULT_PLANS } from '@/app/lib/defaultPlans';
import { clearPlanCache } from '@/app/lib/plan';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

async function backfillGrants(pricing: any) {
    let changed = false;
    (pricing.plans || []).forEach((p: any) => {
        if (p.grantsPro === undefined || p.grantsFleet === undefined) {
            changed = true;
            if (p.id === 'premium') { p.grantsPro = true; p.grantsFleet = false; }
            else if (p.id === 'fleet') { p.grantsPro = true; p.grantsFleet = true; }
            else { p.grantsPro = false; p.grantsFleet = false; }
        }
        if (p.maxMembers === undefined) {
            changed = true;
            p.maxMembers = p.id === 'fleet' ? 10 : 0;
        }
    });
    if (changed) {
        pricing.markModified('plans');
        await pricing.save();
    }
}

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
        } else {
            pricing.plans = DEFAULT_PLANS;
        }
        await pricing.save();
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
        await backfillGrants(pricing);
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
            durationDays: body.durationDays ?? 0,
            stripePriceId: body.stripePriceId || '',
            grantsPro: !!body.grantsPro,
            grantsFleet: !!body.grantsFleet,
            description: body.description || '',
            features: Array.isArray(body.features) ? body.features : [],
            highlight: !!body.highlight,
            active: body.active !== undefined ? !!body.active : true,
            order: body.order ?? pricing.plans.length,
            color: body.color || 'from-blue-400 to-indigo-500',
        cta: body.cta || '',
        ctaLink: body.ctaLink || '',
        serviceTime: body.serviceTime ?? 5,
        maxMembers: body.maxMembers ?? 0,
    };

    pricing.plans.push(plan);
        pricing.updatedAt = new Date();
        await pricing.save();
        clearPlanCache();

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
        if (body.durationDays !== undefined) existing.durationDays = body.durationDays;
        if (body.stripePriceId !== undefined) existing.stripePriceId = body.stripePriceId;
        if (body.grantsPro !== undefined) existing.grantsPro = !!body.grantsPro;
        if (body.grantsFleet !== undefined) existing.grantsFleet = !!body.grantsFleet;
        if (body.description !== undefined) existing.description = body.description;
        if (body.features !== undefined) existing.features = Array.isArray(body.features) ? body.features : [];
        if (body.highlight !== undefined) existing.highlight = !!body.highlight;
        if (body.active !== undefined) existing.active = !!body.active;
        if (body.order !== undefined) existing.order = body.order;
        if (body.color !== undefined) existing.color = body.color;
        if (body.cta !== undefined) existing.cta = body.cta;
        if (body.ctaLink !== undefined) existing.ctaLink = body.ctaLink;
        if (body.serviceTime !== undefined) existing.serviceTime = body.serviceTime;
        if (body.maxMembers !== undefined) existing.maxMembers = body.maxMembers;

        pricing.updatedAt = new Date();
        await pricing.save();
        clearPlanCache();

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
        clearPlanCache();

        return NextResponse.json(pricing);
    } catch (error) {
        console.error('[ADMIN_PRICING_DELETE] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
