import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET /api/admin/bookings — list all bookings
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const botId = searchParams.get("botId") || undefined;
        const status = searchParams.get("status") || undefined;
        const dateFrom = searchParams.get("dateFrom") || undefined;
        const dateTo = searchParams.get("dateTo") || undefined;
        const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;

        const data = await gpu.bookings.list(botId, { status, dateFrom, dateTo, page });
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Bookings list error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST /api/admin/bookings — create a booking
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = await gpu.bookings.create(body);
        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        console.error("Booking create error:", err);
        const status = err.message?.includes("already booked") ? 409 : 500;
        return NextResponse.json({ error: err.message }, { status });
    }
}
