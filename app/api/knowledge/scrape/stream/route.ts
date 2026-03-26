import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * SSE Proxy: GET /api/knowledge/scrape/stream?jobId=xxx
 * Bridges the GPU backend SSE stream to the browser so the client
 * doesn't need direct access to the GPU IP.
 */
export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) {
        return new Response(JSON.stringify({ error: "Missing jobId" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const GPU_URL =
        process.env.GPU_BACKEND_URL ||
        process.env.NEXT_PUBLIC_GPU_BACKEND_URL ||
        "";

    if (!GPU_URL) {
        return new Response(JSON.stringify({ error: "GPU_BACKEND_URL not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Connect to GPU SSE stream
    const gpuRes = await fetch(`${GPU_URL}/api/scrape/stream/${jobId}`, {
        headers: { Accept: "text/event-stream" },
    });

    if (!gpuRes.ok) {
        const errText = await gpuRes.text().catch(() => "");
        return new Response(JSON.stringify({ error: `GPU error: ${gpuRes.status} ${errText}` }), {
            status: gpuRes.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Pipe the GPU SSE stream directly to the client
    return new Response(gpuRes.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
