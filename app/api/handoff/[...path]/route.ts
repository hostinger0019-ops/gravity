import { NextRequest, NextResponse } from "next/server";

const GPU = process.env.GPU_BACKEND_URL || "http://localhost:8000";
const KEY = process.env.GPU_API_KEY || "";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const sub = path.join("/");
  const qs = req.nextUrl.search || "";
  const res = await fetch(`${GPU}/api/handoff/${sub}${qs}`, {
    headers: { "X-API-Key": KEY },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const sub = path.join("/");
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${GPU}/api/handoff/${sub}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
