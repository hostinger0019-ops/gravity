import { NextRequest, NextResponse } from "next/server";

const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://69.19.137.175:8000";

/**
 * Image proxy — serves GPU images through HTTPS
 * /api/img/images/chatbot-id/123.jpg → http://GPU:8000/images/chatbot-id/123.jpg
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    const imagePath = "/" + path.join("/");
    const gpuImageUrl = `${GPU_URL}${imagePath}`;

    try {
        const res = await fetch(gpuImageUrl, {
            headers: { "User-Agent": "Agent Forja/1.0" },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            return new NextResponse("Image not found", { status: 404 });
        }

        const buffer = await res.arrayBuffer();
        const contentType = res.headers.get("content-type") || "image/jpeg";

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable",
            },
        });
    } catch {
        return new NextResponse("Image fetch failed", { status: 502 });
    }
}
