import { NextResponse, type NextRequest } from "next/server";

/**
 * Voice Realtime API - Streaming ASR + LLM + TTS Pipeline
 * 
 * This endpoint receives audio, transcribes it with Whisper,
 * sends to LLM, and returns TTS audio.
 * 
 * Architecture:
 * ┌────────────┐   audio    ┌──────────────┐   text    ┌─────────┐   text    ┌──────────┐   audio    ┌────────────┐
 * │   Client   │ ─────────► │ Whisper ASR  │ ────────► │ Backend │ ────────► │  vLLM    │ ────────► │ Kokoro TTS │ ──► Client
 * │  (Audio)   │            │   (GPU 0)    │           │         │           │ (GPU 0+1)│           │  (GPU 1)   │
 * └────────────┘            └──────────────┘           └─────────┘           └──────────┘           └────────────┘
 */

const WHISPER_ASR_URL = process.env.WHISPER_ASR_URL || "http://localhost:8003";
const VLLM_API_URL = process.env.VLLM_API_URL || "http://localhost:8000";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen2.5-32B-Instruct-AWQ";
const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "http://localhost:8001";
const KOKORO_TTS_VOICE = process.env.KOKORO_TTS_VOICE || "hf_alpha";

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

// Bot config cache
interface CachedBot { bot: any; systemPrompt: string; timestamp: number; }
const botCache = new Map<string, CachedBot>();
const CACHE_TTL = 5 * 60 * 1000;

async function getBotWithCache(slug: string): Promise<CachedBot | null> {
    const cached = botCache.get(slug);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) return cached;

    const { getBotForPublic } = await import("@/data/runtime");
    const { buildSystemPrompt } = await import("@/lib/prompt");
    const bot = await getBotForPublic(slug);
    if (!bot) return null;

    const entry = { bot, systemPrompt: buildSystemPrompt(bot), timestamp: Date.now() };
    botCache.set(slug, entry);
    return entry;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        // Get form data with audio
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;
        const slug = formData.get("slug") as string || "default";
        const historyJson = formData.get("history") as string || "[]";
        const language = formData.get("language") as string || "hi";

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file required" }, { status: 400 });
        }

        console.log(`[Realtime] Starting pipeline, audio size: ${audioFile.size} bytes`);

        // Step 1: Transcribe audio with Whisper ASR
        const asrStart = Date.now();
        const asrFormData = new FormData();
        asrFormData.append("audio", audioFile);
        asrFormData.append("language", language);

        const asrRes = await fetch(`${WHISPER_ASR_URL}/transcribe`, {
            method: "POST",
            body: asrFormData,
        });

        if (!asrRes.ok) {
            console.error("[Realtime] ASR failed:", await asrRes.text());
            return NextResponse.json({ error: "ASR failed" }, { status: 500 });
        }

        const asrData = await asrRes.json();
        const transcribedText = asrData.text;
        console.log(`[Realtime] ASR: "${transcribedText}" in ${Date.now() - asrStart}ms`);

        if (!transcribedText?.trim()) {
            return NextResponse.json({ error: "No speech detected" }, { status: 400 });
        }

        // Step 2: Get bot config
        const cached = await getBotWithCache(slug);
        if (!cached) return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        const { systemPrompt } = cached;

        // Step 3: Build messages for LLM - Use full system prompt for quality
        let history: ChatMessage[] = [];
        try {
            history = JSON.parse(historyJson);
        } catch { }

        const messages: ChatMessage[] = [
            { role: "system", content: `${systemPrompt}\n\nIMPORTANT: Respond in Hindi. Be concise (1-2 sentences max). No markdown.` },
        ];
        history.slice(-4).forEach(m => messages.push({ role: m.role, content: String(m.content) }));
        messages.push({ role: "user", content: transcribedText });

        // Step 4: Call vLLM with full context
        const llmStart = Date.now();
        const llmRes = await fetch(`${VLLM_API_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: VLLM_MODEL,
                messages,
                max_tokens: 100,
                temperature: 0.7,
                stream: false,
            }),
        });

        if (!llmRes.ok) {
            console.error("[Realtime] LLM failed:", await llmRes.text());
            return NextResponse.json({ error: "LLM failed" }, { status: 500 });
        }

        const llmData = await llmRes.json();
        const responseText = llmData.choices?.[0]?.message?.content || "";
        console.log(`[Realtime] LLM: "${responseText.substring(0, 50)}..." in ${Date.now() - llmStart}ms`);

        // Step 5: Generate TTS audio
        const ttsStart = Date.now();
        const ttsRes = await fetch(`${KOKORO_TTS_URL}/synthesize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: responseText,
                voice: KOKORO_TTS_VOICE,
                speed: 1.0,
            }),
        });

        if (!ttsRes.ok) {
            console.error("[Realtime] TTS failed:", await ttsRes.text());
            return NextResponse.json({ error: "TTS failed" }, { status: 500 });
        }

        const audioBuffer = await ttsRes.arrayBuffer();
        console.log(`[Realtime] TTS: ${audioBuffer.byteLength} bytes in ${Date.now() - ttsStart}ms`);

        console.log(`[Realtime] TOTAL: ${Date.now() - startTime}ms | ASR: ${asrData.duration?.toFixed(2)}s | Text: "${transcribedText}" -> "${responseText.substring(0, 30)}..."`);

        // Return audio with metadata headers
        return new Response(audioBuffer, {
            headers: {
                "Content-Type": "audio/wav",
                "X-Transcribed-Text": encodeURIComponent(transcribedText),
                "X-Response-Text": encodeURIComponent(responseText),
                "X-Total-Time": String(Date.now() - startTime),
            },
        });

    } catch (error) {
        console.error("[Realtime] Pipeline error:", error);
        return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
    }
}

export async function GET() {
    // Health check
    return NextResponse.json({
        status: "ok",
        services: {
            whisper: WHISPER_ASR_URL,
            vllm: VLLM_API_URL,
            kokoro: KOKORO_TTS_URL,
        },
    });
}
