import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET /api/admin/bookings/availability?botId=xxx&date=2026-04-10&service=Haircut
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const botId = searchParams.get("botId");
        const date = searchParams.get("date");
        const service = searchParams.get("service") || undefined;

        if (!botId || !date) {
            return NextResponse.json({ error: "botId and date are required" }, { status: 400 });
        }

        const data = await gpu.bookings.getAvailability(botId, date, service);
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Availability error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
