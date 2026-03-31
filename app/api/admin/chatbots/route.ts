import { NextResponse } from "next/server";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";

// GET - List all chatbots (server-side proxy to GPU backend)
export async function GET() {
    try {
        const res = await fetch(`${GPU_URL}/api/chatbots`, {
            cache: "no-store",
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => "");
            return NextResponse.json(
                { error: `GPU backend error: ${res.status} ${errText}` },
                { status: res.status }
            );
        }

        const chatbots = await res.json();
        return NextResponse.json(chatbots);
    } catch (error: any) {
        console.error("[API] Failed to list chatbots:", error.message);
        return NextResponse.json(
            { error: "Failed to connect to GPU backend" },
            { status: 502 }
        );
    }
}
