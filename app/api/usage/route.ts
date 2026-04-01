import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gpu } from "@/lib/gpuBackend";

// GET - Get usage for current user (proxies to GPU backend)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const userId = url.searchParams.get("userId") || (session.user as any).gpu_id;
        if (!userId) {
            return NextResponse.json({ message_count: 0, voice_minutes: 0 });
        }

        const usage = await gpu.usage.get(userId);
        return NextResponse.json(usage);
    } catch (error: any) {
        console.error("[API] Usage fetch error:", error.message);
        return NextResponse.json({ message_count: 0, voice_minutes: 0 });
    }
}
