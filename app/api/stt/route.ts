import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/stt — Direct Speech-to-Text via Parakeet STT
 *
 * Receives audio from the frontend and forwards it to the Parakeet STT
 * service running on the RunPod GPU pod for transcription.
 *
 * Request: FormData with "audio" file field
 * Response: { text: string, latency_ms: number }
 */

const PARAKEET_STT_URL =
    process.env.PARAKEET_STT_URL || "http://localhost:5555";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided. Send FormData with 'audio' field." },
                { status: 400 }
            );
        }

        console.log(
            `[STT] Transcribing ${audioFile.size} bytes → ${PARAKEET_STT_URL}/transcribe`
        );

        // Forward audio to Parakeet STT
        const sttFormData = new FormData();
        const audioBuffer = await audioFile.arrayBuffer();
        sttFormData.append(
            "file",
            new Blob([audioBuffer], { type: audioFile.type || "audio/wav" }),
            "audio.wav"
        );

        const sttRes = await fetch(`${PARAKEET_STT_URL}/transcribe`, {
            method: "POST",
            body: sttFormData,
        });

        if (!sttRes.ok) {
            const errorText = await sttRes.text().catch(() => "Unknown error");
            console.error(`[STT] Parakeet error ${sttRes.status}: ${errorText}`);
            return NextResponse.json(
                { error: `STT failed: ${sttRes.status}`, detail: errorText },
                { status: 502 }
            );
        }

        const sttData = await sttRes.json();
        const text = sttData.transcription || sttData.text || "";
        const latencyMs = Date.now() - startTime;

        console.log(`[STT] Done in ${latencyMs}ms: "${text.substring(0, 80)}..."`);

        return NextResponse.json({
            text,
            latency_ms: latencyMs,
        });
    } catch (error: any) {
        // Handle connection refused
        if (
            error.cause?.code === "ECONNREFUSED" ||
            error.message?.includes("fetch failed")
        ) {
            console.warn("[STT] Parakeet STT server not available");
            return NextResponse.json(
                {
                    error: "Parakeet STT server offline",
                    code: "STT_UNAVAILABLE",
                },
                { status: 503 }
            );
        }

        console.error("[STT] Error:", error);
        return NextResponse.json(
            { error: error.message || "Transcription failed" },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    try {
        const res = await fetch(`${PARAKEET_STT_URL}/health`, {
            signal: AbortSignal.timeout(3000),
        });
        const healthy = res.ok;
        return NextResponse.json({
            parakeet: healthy ? "ok" : `status=${res.status}`,
            url: PARAKEET_STT_URL,
        });
    } catch {
        return NextResponse.json({
            parakeet: "down",
            url: PARAKEET_STT_URL,
        });
    }
}
