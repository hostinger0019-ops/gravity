import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// List Instagram connections for a chatbot
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const botId = searchParams.get("botId");

    if (!botId) {
        return NextResponse.json({ error: "botId required" }, { status: 400 });
    }

    try {
        const connection = await gpu.instagram.getConnection(botId);
        return NextResponse.json({ connection: connection || null });
    } catch {
        return NextResponse.json({ connection: null });
    }
}
