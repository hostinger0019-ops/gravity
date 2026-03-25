import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Admin: list conversations for a bot.
// GPU backend handles auth — no Supabase auth checks needed.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const botId = url.searchParams.get("botId");
    if (!botId) return NextResponse.json({ error: "Missing botId" }, { status: 400 });
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(Math.max(1, Number(url.searchParams.get("pageSize") || 50)), 100);
    const q = url.searchParams.get("q")?.trim();

    const data = await gpu.conversations.listByBot(botId, { page, pageSize, q: q || undefined });
    return NextResponse.json({ conversations: data || [] });
  } catch (err: any) {
    console.error("GET /api/admin/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
