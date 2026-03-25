import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET all orders for admin (across all bots)
export async function GET(req: NextRequest) {
    try {
        const data = await gpu.orders.list();
        return NextResponse.json({ orders: data || [] });
    } catch (err: any) {
        console.error("Admin orders API error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
