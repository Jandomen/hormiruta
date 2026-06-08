import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Pricing from '@/app/models/Pricing';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = await Pricing.create({});
        }

        return NextResponse.json(pricing);
    } catch (error) {
        console.error("[ADMIN_PRICING_GET] Error:", error);
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

        await dbConnect();

        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = new Pricing();
        }

        if (body.premium) {
            if (body.premium.price !== undefined) pricing.premium.price = body.premium.price;
            if (body.premium.trialDays !== undefined) pricing.premium.trialDays = body.premium.trialDays;
        }
        if (body.fleet) {
            if (body.fleet.price !== undefined) pricing.fleet.price = body.fleet.price;
            if (body.fleet.trialDays !== undefined) pricing.fleet.trialDays = body.fleet.trialDays;
        }

        pricing.updatedAt = new Date();
        await pricing.save();

        return NextResponse.json(pricing);
    } catch (error) {
        console.error("[ADMIN_PRICING_PUT] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
