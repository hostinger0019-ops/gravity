import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gpu } from "@/lib/gpuBackend";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";

/** Resolve the user's gpu_id from session, syncing if needed */
async function getGpuId(session: any): Promise<string | null> {
    let gpuId = session?.user?.gpu_id;
    if (!gpuId && session?.user?.email) {
        try {
            const res = await fetch(`${GPU_URL}/api/users/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user.email,
                    name: session.user.name || "",
                    avatar_url: session.user.image || "",
                }),
                signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
                const data = await res.json();
                gpuId = data.id;
            }
        } catch {}
    }
    return gpuId || null;
}

// GET - List chatbots owned by the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const gpuId = await getGpuId(session);
        if (!gpuId) {
            return NextResponse.json({ error: "User not synced" }, { status: 401 });
        }

        // Only list chatbots owned by this user
        const chatbots = await gpu.chatbots.list({ ownerId: gpuId });
        return NextResponse.json(chatbots);
    } catch (error: any) {
        console.error("[API] Failed to list chatbots:", error.message);
        return NextResponse.json(
            { error: "Failed to connect to GPU backend" },
            { status: 502 }
        );
    }
}

// POST - Create a new chatbot (with owner_id from session)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const gpuId = await getGpuId(session);
        if (!gpuId) {
            return NextResponse.json({ error: "User not synced" }, { status: 401 });
        }

        const payload = await req.json();
        // Force owner_id to the authenticated user
        payload.owner_id = gpuId;

        // Check chatbot limit
        const currentBots = await gpu.chatbots.list({ ownerId: gpuId });
        const usageCheck = await gpu.usage.check(gpuId).catch(() => null);
        const planData = await gpu.userPlan.get(gpuId).catch(() => ({ plan: { chatbot_limit: 1 } }));
        const limit = planData?.plan?.chatbot_limit ?? 1;

        if (limit > 0 && currentBots.length >= limit) {
            return NextResponse.json(
                { error: `Chatbot limit reached. Your plan allows ${limit} chatbot(s). Upgrade to create more.` },
                { status: 403 }
            );
        }

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
