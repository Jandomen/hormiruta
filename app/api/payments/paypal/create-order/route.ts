
import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/app/lib/paypal";

export async function POST(req: Request) {
    try {
        const { plan, amount } = await req.json();

        if (!plan || !amount) {
            return NextResponse.json({ error: "Missing plan or amount" }, { status: 400 });
        }

        const order = await createPayPalOrder(plan, amount);
        return NextResponse.json(order);
    } catch (error: any) {
        console.error("[PAYPAL_CREATE_ORDER_ERROR]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
