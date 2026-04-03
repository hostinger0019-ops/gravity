import { NextResponse, type NextRequest } from "next/server";
import { getBotForPublic } from "@/data/runtime";
import { gpu } from "@/lib/gpuBackend";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found or not public" }, { status: 404 });

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const pageSize = Math.min(Number(url.searchParams.get("pageSize") || 50), 100);
    const q = url.searchParams.get("q")?.trim();
    const visitorId = url.searchParams.get("visitorId")?.trim();

    const data = await gpu.conversations.listByBot(bot.id, { page, pageSize, q: q || undefined, visitorId: visitorId || undefined });
    return NextResponse.json({ conversations: data || [] });
  } catch (err: any) {
    console.error("GET /bots/[slug]/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found or not public" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const title: string = (body?.title || "New Chat").slice(0, 60);
    const visitorId: string | undefined = typeof body?.visitor_id === "string" ? body.visitor_id : undefined;

    const data = await gpu.conversations.create({ bot_id: bot.id, title, visitor_id: visitorId });
    return NextResponse.json({ conversation: data });
  } catch (err: any) {
    console.error("POST /bots/[slug]/conversations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
