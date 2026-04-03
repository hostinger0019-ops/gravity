import { NextRequest, NextResponse } from "next/server";

/**
 * Voice Pipeline for Agent Forja Builder Chat
 * Flow: Audio → Parakeet STT → RAG → vLLM (same system prompt) → Kokoro TTS → Audio back
 */

const PARAKEET_STT_URL = process.env.PARAKEET_STT_URL || "http://195.26.233.15:36648";
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || "http://195.26.233.15:36649";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATOR_API_KEY || "test-key-1";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ";
const KOKORO_TTS_VOICE = process.env.KOKORO_TTS_VOICE || "af_heart";

// Same system prompt as the chat route
const DEFAULT_VOICE_SYSTEM_PROMPT = `You are Agent Forja AI, a chatbot builder assistant powered by a self-hosted LLM. You are NOT ChatGPT, NOT Claude, NOT Anthropic, NOT OpenAI. You are Agent Forja's own AI assistant.

IMPORTANT: You are in VOICE mode. Keep responses SHORT (2-3 sentences max).
- Use simple, spoken language. No technical jargon.
- NO markdown, NO bullet points, NO numbered lists, NO special formatting.
- NO emojis, NO asterisks, NO code blocks.
- Be warm, friendly, and conversational.
- Help users create and manage their chatbots through voice.
- If they want to create a bot, ask 1-2 quick questions, then confirm.`;

const GPU_BACKEND_VOICE_URL = process.env.GPU_BACKEND_URL || "";
const GPU_API_KEY_VOICE = process.env.GPU_API_KEY || "";

async function getVoicePrompt(): Promise<string> {
  try {
    const res = await fetch(`${GPU_BACKEND_VOICE_URL}/api/admin/prompts/voice_prompt`, {
      headers: GPU_API_KEY_VOICE ? { "X-API-Key": GPU_API_KEY_VOICE } : {},
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.prompt || DEFAULT_VOICE_SYSTEM_PROMPT;
    }
  } catch {}
  return DEFAULT_VOICE_SYSTEM_PROMPT;
}

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;
        const historyRaw = formData.get("history") as string;
        const history = historyRaw ? JSON.parse(historyRaw) : [];

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file" }, { status: 400 });
        }

        console.log(`[Voice] Start: ${audioFile.size} bytes`);

        // =========== Step 1: Parakeet STT ===========
        const sttStart = Date.now();
        const sttForm = new FormData();
        const audioBuffer = await audioFile.arrayBuffer();
        sttForm.append("file", new Blob([audioBuffer], { type: audioFile.type }), "audio.webm");

        let sttRes;
        try {
            sttRes = await fetch(`${PARAKEET_STT_URL}/transcribe`, {
                method: "POST",
                body: sttForm,
            });
        } catch (e: any) {
            console.error("[Voice] Parakeet STT unreachable:", e.message);
            return NextResponse.json({ error: "Speech recognition unavailable" }, { status: 503 });
        }

        if (!sttRes.ok) {
            console.error("[Voice] STT failed:", await sttRes.text());
            return NextResponse.json({ error: "Speech recognition failed" }, { status: 500 });
        }

        const sttData = await sttRes.json();
        const transcribedText = sttData.transcription || sttData.text || "";
        const sttMs = Date.now() - sttStart;
        console.log(`[Voice] STT: "${transcribedText}" (${sttMs}ms)`);

        if (!transcribedText.trim()) {
            return NextResponse.json({ error: "No speech detected" }, { status: 400 });
        }

        // =========== Step 2: RAG Context Retrieval ===========
        let ragContext = "";
        const ragStart = Date.now();
        try {
            const ragRes = await fetch(`${ORCHESTRATOR_URL}/api/rag-chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ORCHESTRATOR_API_KEY,
                },
                body: JSON.stringify({
                    message: transcribedText,
                    system_prompt: await getVoicePrompt(),
                    max_tokens: 200,
                    temperature: 0.7,
                }),
            });

            if (ragRes.ok) {
                const ragData = await ragRes.json();
                // Use the RAG response directly since it already includes LLM output
                if (ragData.response) {
                    ragContext = ragData.response;
                    console.log(`[Voice] RAG+LLM response: "${ragContext.substring(0, 50)}..." (${Date.now() - ragStart}ms)`);
                }
            } else {
                console.warn(`[Voice] RAG failed (${ragRes.status}), using vLLM directly`);
            }
        } catch (e: any) {
            console.warn("[Voice] RAG unreachable, using vLLM directly:", e.message);
        }

        // =========== Step 3: vLLM (if RAG didn't provide response) ===========
        let llmResponse = ragContext;
        if (!llmResponse) {
            const llmStart = Date.now();
            try {
                const messages = [
                    { role: "system", content: VOICE_SYSTEM_PROMPT },
                    ...history.slice(-4).map((m: any) => ({ role: m.role, content: m.content })),
                    { role: "user", content: transcribedText },
                ];

                const llmRes = await fetch(`${ORCHESTRATOR_URL}/v1/chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": ORCHESTRATOR_API_KEY,
                    },
                    body: JSON.stringify({
                        model: VLLM_MODEL,
                        messages,
                        max_tokens: 200,
                        temperature: 0.7,
                    }),
                });

                if (llmRes.ok) {
                    const data = await llmRes.json();
                    llmResponse = data.choices?.[0]?.message?.content || "";
                    console.log(`[Voice] vLLM: "${llmResponse.substring(0, 50)}..." (${Date.now() - llmStart}ms)`);
                } else {
                    console.error("[Voice] vLLM failed:", llmRes.status);
                    return NextResponse.json({ error: "AI response failed" }, { status: 500 });
                }
            } catch (e: any) {
                console.error("[Voice] vLLM error:", e.message);
                return NextResponse.json({ error: "AI response failed" }, { status: 500 });
            }
        }

        // =========== Step 4: Kokoro TTS ===========
        const ttsStart = Date.now();
        let audioBase64 = "";
        try {
            const ttsRes = await fetch(`${ORCHESTRATOR_URL}/api/tts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ORCHESTRATOR_API_KEY,
                },
                body: JSON.stringify({
                    text: llmResponse,
                    voice: KOKORO_TTS_VOICE,
                    speed: 1.0,
                }),
            });

            if (ttsRes.ok) {
                const audioArrayBuffer = await ttsRes.arrayBuffer();
                audioBase64 = Buffer.from(audioArrayBuffer).toString("base64");
                console.log(`[Voice] TTS: ${audioArrayBuffer.byteLength} bytes (${Date.now() - ttsStart}ms)`);
            } else {
                console.warn(`[Voice] TTS failed (${ttsRes.status}), returning text only`);
            }
        } catch (e: any) {
            console.warn("[Voice] TTS unreachable, returning text only:", e.message);
        }

        const totalMs = Date.now() - startTime;
        console.log(`[Voice] ✅ Total: ${totalMs}ms`);

        return NextResponse.json({
            transcription: transcribedText,
            response: llmResponse,
            audio: audioBase64 || null,
            timings: {
                stt: sttMs,
                total: totalMs,
            },
        });

    } catch (error: any) {
        console.error("[Voice] Error:", error);
        return NextResponse.json({ error: error.message || "Voice processing failed" }, { status: 500 });
    }
}
