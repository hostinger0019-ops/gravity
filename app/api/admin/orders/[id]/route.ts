import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// PATCH to update order status
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;
        const body = await req.json().catch(() => ({}));
        const { status } = body;

        const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        const data = await gpu.orders.update(id, { status });
        return NextResponse.json({ success: true, order: data });
    } catch (err: any) {
        console.error("Order PATCH error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE an order
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;
        await gpu.orders.delete(id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Order DELETE error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
