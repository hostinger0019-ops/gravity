import { NextRequest, NextResponse } from "next/server";
import { gpuHeaders, getGpuUrl } from "@/lib/gpu-fetch";

const GPU = getGpuUrl();

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const res = await fetch(`${GPU}/api/builder-sessions?email=${encodeURIComponent(email)}`, {
    cache: "no-store",
    headers: gpuHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${GPU}/api/builder-sessions`, {
    method: "POST",
    headers: gpuHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
