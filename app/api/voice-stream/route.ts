import { NextResponse, type NextRequest } from "next/server";
import OpenAI from "openai";
// Lazy import to avoid build-time crash when env vars aren't available
const getSupabase = async () => (await import("@/lib/supabaseServer"));

/**
 * Voice Stream API - Full Streaming Pipeline
 * 
 * Architecture:
 * ┌────────────┐   tokens    ┌─────────────┐   sentences   ┌────────────┐   audio    ┌────────────┐
 * │   vLLM     │ ──────────► │   Backend   │ ────────────► │  Kokoro    │ ─────────► │   Client   │
 * │ (Streaming)│             │ (Accumulate)│               │   (TTS)    │            │  (Audio)   │
 * └────────────┘             └─────────────┘               └────────────┘            └────────────┘
 * 
 * Flow:
 * 1. LLM streams tokens to backend
 * 2. Backend accumulates tokens into complete sentences
 * 3. Each sentence is sent to TTS immediately (parallel with LLM continuing)
 * 4. TTS audio chunks are streamed to client as they're ready
 */

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

// Vector similarity for RAG
function cosineSim(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2;
    }
    return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Sentence splitter - detects complete sentences for TTS
function extractCompleteSentences(text: string): { complete: string[], remainder: string } {
    const sentences: string[] = [];
    let remainder = text;

    // Match sentences ending with . ! ? followed by space or end
    const pattern = /^(.*?[.!?]+)\s+/;
    let match;

    while ((match = pattern.exec(remainder)) !== null) {
        sentences.push(match[1].trim());
        remainder = remainder.slice(match[0].length);
    }

    return { complete: sentences, remainder };
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await req.json();
        const { message, history = [], slug } = body as {
            message: string;
            history?: ChatMessage[];
            slug?: string;
        };

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        console.log("[Voice] Starting streaming pipeline");

        // Step 1: Get bot config (cached)
        const cached = await getBotWithCache(slug || "default");
        if (!cached) return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        const { bot, systemPrompt } = cached;

        // Step 2: Quick RAG lookup (limited to 300ms)
        let context = "";
        const ragStart = Date.now();
        try {
            const embKey = process.env.OPENAI_API_KEY;
            if (embKey) {
                const openai = new OpenAI({ apiKey: embKey });
                const emb = await openai.embeddings.create({ model: "text-embedding-3-small", input: message });
                const qvec = emb.data[0]?.embedding as number[];

                const { supabaseService, supabaseServer } = await getSupabase();
                const db = supabaseService() || supabaseServer;
                const { data: rows } = await db
                    .from("knowledge_chunks")
                    .select("chunk_text, embedding")
                    .eq("chatbot_id", bot.id)
                    .limit(200);

                if (rows?.length) {
                    const top = rows
                        .map(r => ({ text: r.chunk_text, score: cosineSim(qvec, r.embedding || []) }))
                        .filter(r => r.score > 0.2)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 2);

                    if (top.length) context = top.map(t => t.text).join("\n\n");
                }
            }
        } catch (e) { console.warn("[Voice] RAG error:", e); }
        console.log("[Voice] RAG:", Date.now() - ragStart, "ms");

        // Step 3: Build LLM messages
        const messages: ChatMessage[] = [
            { role: "system", content: `${systemPrompt}\n\nBe BRIEF (1-2 sentences). No markdown.` },
        ];
        if (context) messages.push({ role: "system", content: `Context: ${context.slice(0, 1500)}` });
        history.slice(-4).forEach(m => messages.push({ role: m.role, content: String(m.content) }));
        messages.push({ role: "user", content: message });

        // Step 4: STREAMING PIPELINE
        console.log("[Voice] Starting streaming to vLLM");

        const stream = new ReadableStream({
            async start(controller) {
                let fullText = "";
                let textBuffer = "";
                let sentenceCount = 0;
                let firstAudioSent = false;

                try {
                    // Call vLLM with streaming
                    const llmStart = Date.now();
                    const llmRes = await fetch(`${VLLM_API_URL}/v1/chat/completions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: VLLM_MODEL,
                            messages,
                            max_tokens: 100, // Short for voice
                            temperature: 0.7,
                            stream: true, // ← LLM STREAMS TOKENS TO BACKEND
                        }),
                    });

                    if (!llmRes.ok || !llmRes.body) {
                        throw new Error(`vLLM error: ${llmRes.status}`);
                    }

                    console.log("[Voice] LLM stream started, TTFB:", Date.now() - llmStart, "ms");

                    const reader = llmRes.body.getReader();
                    const decoder = new TextDecoder();
                    let sseBuffer = "";

                    // Process streaming tokens from LLM
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        sseBuffer += decoder.decode(value, { stream: true });

                        // Parse SSE events
                        let idx;
                        while ((idx = sseBuffer.indexOf("\n\n")) !== -1) {
                            const chunk = sseBuffer.slice(0, idx).trim();
                            sseBuffer = sseBuffer.slice(idx + 2);

                            if (!chunk.startsWith("data:")) continue;
                            const data = chunk.slice(5).trim();
                            if (data === "[DONE]") break;

                            try {
                                const json = JSON.parse(data);
                                const token = json?.choices?.[0]?.delta?.content || "";

                                if (token) {
                                    fullText += token;
                                    textBuffer += token;

                                    // Check for complete sentences
                                    const { complete, remainder } = extractCompleteSentences(textBuffer);

                                    for (const sentence of complete) {
                                        if (sentence.length < 5) continue;

                                        sentenceCount++;
                                        console.log(`[Voice] Sentence ${sentenceCount}:`, sentence.substring(0, 40));

                                        // BACKEND STREAMS SENTENCE TO TTS (Kokoro)
                                        try {
                                            const ttsStart = Date.now();
                                            const ttsRes = await fetch(`${KOKORO_TTS_URL}/synthesize`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    text: sentence,
                                                    voice: KOKORO_TTS_VOICE,
                                                    speed: 1.0
                                                }),
                                            });

                                            if (ttsRes.ok) {
                                                const audio = await ttsRes.arrayBuffer();

                                                if (!firstAudioSent) {
                                                    console.log("[Voice] Time to first audio:", Date.now() - startTime, "ms");
                                                    firstAudioSent = true;
                                                }

                                                // TTS STREAMS AUDIO TO CLIENT
                                                controller.enqueue(new Uint8Array(audio));
                                                console.log(`[Voice] Audio chunk ${sentenceCount}: ${audio.byteLength} bytes in ${Date.now() - ttsStart}ms`);
                                            }
                                        } catch (ttsErr) {
                                            console.warn("[Voice] TTS error:", ttsErr);
                                        }
                                    }

                                    textBuffer = remainder;
                                }
                            } catch { }
                        }
                    }

                    console.log("[Voice] LLM complete:", Date.now() - llmStart, "ms");

                    // Process any remaining text
                    if (textBuffer.trim().length >= 3) {
                        sentenceCount++;
                        console.log(`[Voice] Final sentence ${sentenceCount}:`, textBuffer.substring(0, 40));

                        try {
                            const ttsRes = await fetch(`${KOKORO_TTS_URL}/synthesize`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    text: textBuffer.trim(),
                                    voice: KOKORO_TTS_VOICE,
                                    speed: 1.0
                                }),
                            });

                            if (ttsRes.ok) {
                                const audio = await ttsRes.arrayBuffer();
                                controller.enqueue(new Uint8Array(audio));
                                console.log(`[Voice] Final audio: ${audio.byteLength} bytes`);
                            }
                        } catch { }
                    }

                    console.log("[Voice] TOTAL:", Date.now() - startTime, "ms, text:", fullText.length, "chars,", sentenceCount, "sentences");

                } catch (err) {
                    console.error("[Voice] Pipeline error:", err);
                    controller.error(err);
                } finally {
                    controller.close();
                }
            }
        });

        // Return streaming audio response
        return new Response(stream, {
            headers: {
                "Content-Type": "audio/wav",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache, no-store",
                "X-Accel-Buffering": "no", // Disable nginx buffering
            },
        });

    } catch (error) {
        console.error("[Voice] Error:", error);
        return NextResponse.json({ error: "Voice processing failed" }, { status: 500 });
    }
}

// Health check
export async function GET() {
    const checks = await Promise.all([
        fetch(`${VLLM_API_URL}/health`).then(r => r.ok).catch(() => false),
        fetch(`${KOKORO_TTS_URL}/health`).then(r => r.ok).catch(() => false),
    ]);

    return NextResponse.json({
        status: checks.every(Boolean) ? "ok" : "partial",
        vllm: checks[0],
        kokoro: checks[1],
        config: { vllm: VLLM_API_URL, tts: KOKORO_TTS_URL, model: VLLM_MODEL }
    });
}
