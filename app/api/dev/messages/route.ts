import { NextResponse, type NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

// Dev-only helper to list messages by conversation id.
export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_SERVICE_ROUTE !== "true") {
      return NextResponse.json({ error: "Disabled" }, { status: 403 });
    }
    const url = new URL(req.url);
    const cid = url.searchParams.get("cid");
    if (!cid) return NextResponse.json({ error: "Missing cid" }, { status: 400 });

    const messages = await gpu.messages.list(cid);
    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    console.error("GET /api/dev/messages error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
