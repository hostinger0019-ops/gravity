import { NextRequest, NextResponse } from "next/server";

const GPU = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`${GPU}/api/builder-sessions/${id}`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const res = await fetch(`${GPU}/api/builder-sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const res = await fetch(`${GPU}/api/builder-sessions/${id}`, { method: "DELETE" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
