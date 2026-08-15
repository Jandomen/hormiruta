import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Pricing from '@/app/models/Pricing';
import { DEFAULT_PLANS } from '@/app/lib/defaultPlans';

// Sin caché estática: los planes se crean/editan desde el admin en caliente
// y deben verse en la app de inmediato (sin rebuild).
export const dynamic = 'force-dynamic';

// Rellena grantsPro/grantsFleet en planes históricos que no los tengan
// (premium -> pro, fleet -> pro+fleet, custom -> false/false).
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

export async function GET() {
    try {
        await dbConnect();

        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = await Pricing.create({ plans: DEFAULT_PLANS });
        } else if (!pricing.plans || pricing.plans.length === 0) {
            pricing.plans = DEFAULT_PLANS;
            await pricing.save();
        } else {
            // Reconciliar: si un plan ya existe pero le falta el stripePriceId
            // y el default (env STRIPE_{PLAN}_PRICE_ID) ya lo tiene, lo rellenamos.
            const defByName = new Map(DEFAULT_PLANS.map((d) => [d.name, d]));
            const needsPatch = pricing.plans.some((p: any) => {
                const def = defByName.get(p.name);
                return def && def.stripePriceId && !p.stripePriceId;
            });
            if (needsPatch) {
                pricing.plans = pricing.plans.map((p: any) => {
                    const def = defByName.get(p.name);
                    if (def && def.stripePriceId && !p.stripePriceId) {
                        return { ...(p.toObject ? p.toObject() : p), stripePriceId: def.stripePriceId };
                    }
                    return p;
                });
                await pricing.save();
            }
        }

        await backfillGrants(pricing);

        return NextResponse.json({ plans: pricing.plans || [] });
    } catch (error) {
        console.error('[PUBLIC_PRICING_GET] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
