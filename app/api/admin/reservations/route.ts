import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET all reservations for admin (across all bots)
export async function GET(req: NextRequest) {
    try {
        const data = await gpu.reservations.list();
        return NextResponse.json({ reservations: data || [] });
    } catch (err: any) {
        console.error("Admin reservations API error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
