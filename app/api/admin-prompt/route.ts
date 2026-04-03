import { NextResponse } from "next/server";

const GPU_BACKEND_URL = process.env.GPU_BACKEND_URL || "";
const GPU_API_KEY = process.env.GPU_API_KEY || "";

export async function GET() {
  try {
    const res = await fetch(`${GPU_BACKEND_URL}/api/admin/prompts/landing_prompt`, {
      headers: GPU_API_KEY ? { "X-API-Key": GPU_API_KEY } : {},
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ prompt: data.prompt });
    }
  } catch {}
  return NextResponse.json({ prompt: "" });
}
