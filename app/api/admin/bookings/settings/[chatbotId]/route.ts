import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET /api/admin/bookings/settings/[chatbotId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
    try {
        const { chatbotId } = await params;
        const data = await gpu.bookings.settings.get(chatbotId);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT /api/admin/bookings/settings/[chatbotId]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ chatbotId: string }> }) {
    try {
        const { chatbotId } = await params;
        const body = await req.json();
        const data = await gpu.bookings.settings.update(chatbotId, body);
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
