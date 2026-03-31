import { NextRequest, NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// GET - List all chatbots (server-side proxy to GPU backend)
export async function GET() {
    try {
        const chatbots = await gpu.chatbots.list();
        return NextResponse.json(chatbots);
    } catch (error: any) {
        console.error("[API] Failed to list chatbots:", error.message);
        return NextResponse.json(
            { error: "Failed to connect to GPU backend" },
            { status: 502 }
        );
    }
}

// POST - Create a new chatbot (server-side proxy)
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const chatbot = await gpu.chatbots.create(payload);
        return NextResponse.json(chatbot);
    } catch (error: any) {
        console.error("[API] Failed to create chatbot:", error.message);
        return NextResponse.json(
            { error: error.message || "Failed to create chatbot" },
            { status: 500 }
        );
    }
}
