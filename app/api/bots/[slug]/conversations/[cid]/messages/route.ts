import { NextResponse, type NextRequest } from "next/server";
import { getBotForPublic } from "@/data/runtime";
import { gpu } from "@/lib/gpuBackend";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string; cid: string }> }) {
  try {
    const { slug, cid } = await ctx.params;
    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found or not public" }, { status: 404 });

    const messages = await gpu.messages.list(cid);
    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    console.error("GET /bots/[slug]/conversations/[cid]/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string; cid: string }> }) {
  try {
    const { slug, cid } = await ctx.params;
    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found or not public" }, { status: 404 });

    const body = await req.json();
    const { role, content } = body;
    if (!role || !content) {
      return NextResponse.json({ error: "role and content are required" }, { status: 400 });
    }

    const message = await gpu.messages.create({
      conversation_id: cid,
      role,
      content,
    });
    return NextResponse.json({ message });
  } catch (err: any) {
    console.error("POST /bots/[slug]/conversations/[cid]/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
