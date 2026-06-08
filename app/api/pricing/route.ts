import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Pricing from '@/app/models/Pricing';

export async function GET() {
    try {
        await dbConnect();

        let pricing = await Pricing.findOne();
        if (!pricing) {
            pricing = await Pricing.create({});
        }

        return NextResponse.json(pricing);
    } catch (error) {
        console.error("[PUBLIC_PRICING_GET] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
