import { NextResponse, type NextRequest } from "next/server";
import { getBotForPublic } from "@/data/runtime";
import { gpu } from "@/lib/gpuBackend";

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const body = await req.json().catch(() => ({}));

        const { customerName, customerPhone, items, deliveryType, deliveryAddress, notes } = body;
        if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Customer name and at least one item are required" },
                { status: 400 }
            );
        }

        const bot = await getBotForPublic(slug);
        if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

        const data = await gpu.orders.create({
            bot_id: bot.id,
            customer_name: customerName,
            customer_phone: customerPhone || null,
            items: items,
            delivery_type: deliveryType || "pickup",
            delivery_address: deliveryType === "delivery" ? deliveryAddress : null,
            notes: notes || null,
            status: "pending",
        });

        return NextResponse.json({
            success: true,
            orderId: data.id,
            message: "Order placed successfully! We'll prepare it shortly.",
        });
    } catch (err: any) {
        console.error("Order API error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const bot = await getBotForPublic(slug);
        if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

        const data = await gpu.orders.listByBot(bot.id);
        return NextResponse.json({ orders: data || [] });
    } catch (err: any) {
        console.error("Orders GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
