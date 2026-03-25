import { NextResponse, type NextRequest } from "next/server";
import { getBotForPublic } from "@/data/runtime";
import { gpu } from "@/lib/gpuBackend";

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const body = await req.json().catch(() => ({}));

        const { customerName, customerPhone, customerEmail, partySize, date, time, specialRequests } = body;
        if (!customerName || !partySize || !date || !time) {
            return NextResponse.json(
                { error: "Customer name, party size, date, and time are required" },
                { status: 400 }
            );
        }

        const bot = await getBotForPublic(slug);
        if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

        const data = await gpu.reservations.create({
            bot_id: bot.id,
            customer_name: customerName,
            customer_phone: customerPhone || null,
            customer_email: customerEmail || null,
            party_size: partySize,
            reservation_date: date,
            reservation_time: time,
            special_requests: specialRequests || null,
            status: "pending",
        });

        return NextResponse.json({
            success: true,
            reservationId: data.id,
            message: `Reservation request received! We'll confirm your table for ${partySize} on ${date} at ${time}.`,
        });
    } catch (err: any) {
        console.error("Reservation API error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const bot = await getBotForPublic(slug);
        if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

        const data = await gpu.reservations.listByBot(bot.id);
        return NextResponse.json({ reservations: data || [] });
    } catch (err: any) {
        console.error("Reservations GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
