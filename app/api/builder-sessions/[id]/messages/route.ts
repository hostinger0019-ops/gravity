import { NextRequest, NextResponse } from "next/server";
import { gpuHeaders, getGpuUrl } from "@/lib/gpu-fetch";

const GPU = getGpuUrl();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const res = await fetch(`${GPU}/api/builder-sessions/${id}/messages/batch`, {
    method: "POST",
    headers: gpuHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
