import { NextRequest, NextResponse } from "next/server";
import { gpuHeaders, getGpuUrl } from "@/lib/gpu-fetch";

const GPU = getGpuUrl();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`${GPU}/api/builder-sessions/${id}`, { cache: "no-store", headers: gpuHeaders() });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const res = await fetch(`${GPU}/api/builder-sessions/${id}`, {
    method: "PATCH",
    headers: gpuHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`${GPU}/api/builder-sessions/${id}`, { method: "DELETE", headers: gpuHeaders() });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
