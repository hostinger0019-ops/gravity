import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Dev-only helper to list conversations by botId.
export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_SERVICE_ROUTE !== "true") {
      return NextResponse.json({ error: "Disabled" }, { status: 403 });
    }
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Math.min(Number(url.searchParams.get("pageSize") || 50), 100);
    const q = url.searchParams.get("q")?.trim();

    if (!botId) return NextResponse.json({ error: "Missing botId" }, { status: 400 });

    const data = await gpu.conversations.listByBot(botId, { page, pageSize, q: q || undefined });
    return NextResponse.json({ conversations: data || [] });
  } catch (err: any) {
    console.error("GET /api/dev/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
