import { NextResponse } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_SERVICE_ROUTE !== "true") {
      return NextResponse.json({ error: "Disabled" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const botId = body?.botId as string | undefined;
    const title = (body?.title as string | undefined) ?? "New Chat";
    if (!botId) return NextResponse.json({ error: "botId is required" }, { status: 400 });

    const data = await gpu.conversations.create({ bot_id: botId, title });
    return NextResponse.json({ conversation: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
