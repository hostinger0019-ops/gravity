import { NextRequest, NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET /api/leads?botId=xxx — list leads for a chatbot
export async function GET(req: NextRequest) {
    try {
        const botId = req.nextUrl.searchParams.get("botId");
        if (!botId) {
            return NextResponse.json({ error: "botId required" }, { status: 400 });
        }
        const leads = await gpu.leads.list(botId);
        return NextResponse.json({ leads: leads || [] });
    } catch (error: any) {
        console.error("List leads error:", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}
