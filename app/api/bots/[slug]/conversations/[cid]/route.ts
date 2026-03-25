import { NextResponse, type NextRequest } from "next/server";
import { getBotForPublic } from "@/data/runtime";
import { gpu } from "@/lib/gpuBackend";

// PATCH: rename a conversation
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string; cid: string }> }) {
  try {
    const { slug, cid } = await ctx.params;
    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found or not public" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const rawTitle: string = (body?.title ?? "").toString();
    const title = rawTitle.slice(0, 60);
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const data = await gpu.conversations.update(cid, { title });
    return NextResponse.json({ conversation: data });
  } catch (err: any) {
    console.error("PATCH /bots/[slug]/conversations/[cid] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE: delete a conversation
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string; cid: string }> }) {
  try {
    const { slug, cid } = await ctx.params;
    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found or not public" }, { status: 404 });

    await gpu.conversations.delete(cid);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /bots/[slug]/conversations/[cid] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
