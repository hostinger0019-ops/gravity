import { NextRequest, NextResponse } from "next/server";

const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "http://34.93.173.105:8080";
const KOKORO_TTS_VOICE = process.env.KOKORO_TTS_VOICE || "af_bella";

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { text, voice = KOKORO_TTS_VOICE } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Missing 'text' field" },
                { status: 400 }
            );
        }

        console.log(`[TTS API] Synthesizing ${text.length} chars: "${text.substring(0, 50)}..."`);

        // Call Kokoro TTS API (OpenAI-compatible format)
        const fetchStart = Date.now();
        const ttsResponse = await fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                input: text,
                voice,
                // Request faster synthesis if supported
                speed: 1.0,
            }),
        });

        if (!ttsResponse.ok) {
            const errorText = await ttsResponse.text();
            console.error("Kokoro TTS error:", errorText);
            return NextResponse.json(
                { error: "TTS synthesis failed", details: errorText },
                { status: ttsResponse.status }
            );
        }

        const fetchEnd = Date.now();
        console.log(`[TTS API] Kokoro response received in ${fetchEnd - fetchStart}ms`);

        // Stream the response directly for lower latency
        const audioBuffer = await ttsResponse.arrayBuffer();
        const totalTime = Date.now() - startTime;
        console.log(`[TTS API] Total time: ${totalTime}ms, audio size: ${audioBuffer.byteLength} bytes`);

        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": audioBuffer.byteLength.toString(),
                // Prevent caching to ensure fresh responses
                "Cache-Control": "no-store",
            },
        });
    } catch (error: any) {
        console.error("Kokoro TTS route error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: error?.message },
            { status: 500 }
        );
    }
}

// GET endpoint to list available voices
export async function GET() {
    try {
        const response = await fetch(`${KOKORO_TTS_URL}/v1/voices`);
        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch voices" },
                { status: response.status }
            );
        }
        const voices = await response.json();
        return NextResponse.json(voices);
    } catch (error: any) {
        console.error("Kokoro voices fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch voices", message: error?.message },
            { status: 500 }
        );
    }
}
