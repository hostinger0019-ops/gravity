import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Admin: list messages for a conversation.
// GPU backend handles auth — no Supabase auth checks needed.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cid = url.searchParams.get("cid");
    if (!cid) return NextResponse.json({ error: "Missing cid" }, { status: 400 });

    const messages = await gpu.messages.list(cid);
    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    console.error("GET /api/admin/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
