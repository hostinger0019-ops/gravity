import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GPU_URL = process.env.GPU_BACKEND_URL || "http://localhost:8000";
const GPU_API_KEY = process.env.GPU_API_KEY || "";
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { path } = await params;
  const gpuPath = path.join("/");
  const url = `${GPU_URL}/api/admin/${gpuPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(GPU_API_KEY ? { "X-API-Key": GPU_API_KEY } : {}),
  };

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      if (body) fetchOptions.body = body;
    }

    // Forward query params
    const searchParams = req.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${url}?${searchParams}` : url;

    const res = await fetch(fullUrl, fetchOptions);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("[SuperAdmin API]", error);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
