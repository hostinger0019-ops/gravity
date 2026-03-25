import { NextRequest, NextResponse } from "next/server";

/**
 * Voice Ultra API - Sentence-by-Sentence Streaming
 * 
 * Flow:
 * 1. ASR: Convert user audio to text (Whisper)
 * 2. LLM: Stream response and extract sentences
 * 3. TTS: Convert each sentence to audio as it arrives
 * 4. Client: Receive and queue audio chunks for seamless playback
 */

const WHISPER_ASR_URL = process.env.WHISPER_ASR_URL || "http://localhost:8003";
const VLLM_API_URL = process.env.VLLM_API_URL || "http://localhost:8000";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen2.5-32B-Instruct-AWQ";
const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "http://localhost:8001";
const KOKORO_TTS_VOICE = process.env.KOKORO_TTS_VOICE || "hf_alpha";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const timings: Record<string, number> = {};

    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;
        const slug = formData.get("slug") as string;
        const language = (formData.get("language") as string) || "hi";
        const historyRaw = formData.get("history") as string;
        const history = historyRaw ? JSON.parse(historyRaw) : [];

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file" }, { status: 400 });
        }

        console.log(`[Ultra] Start: ${audioFile.size} bytes`);

        // Get bot info if slug provided
        let bot: any = { name: "Assistant", directive: "" };
        if (slug && slug !== "default") {
            try {
                const { getBotForPublic } = await import("@/data/runtime");
                const botData = await getBotForPublic(slug);
                if (botData) bot = botData;
            } catch (e) {
                console.warn("[Ultra] Bot fetch failed:", e);
            }
        }

        // ASR: Speech to Text using /transcribe endpoint
        const asrStart = Date.now();
        console.log(`[Ultra] [T+${asrStart - startTime}ms] Sending to ASR...`);

        const asrFormData = new FormData();
        const audioBuffer = await audioFile.arrayBuffer();
        asrFormData.append("audio", new Blob([audioBuffer], { type: audioFile.type }), "audio.webm");
        asrFormData.append("language", language);

        let asrRes;
        try {
            asrRes = await fetch(`${WHISPER_ASR_URL}/transcribe`, {
                method: "POST",
                body: asrFormData,
            });
        } catch (asrError: any) {
            // Handle connection refused or network errors
            if (asrError.cause?.code === "ECONNREFUSED" || asrError.message?.includes("fetch failed")) {
                console.warn("[Ultra] Whisper ASR server not available - use browser-based voice instead");
                return NextResponse.json({
                    error: "Voice server offline. Use the microphone button for browser-based voice.",
                    code: "ASR_UNAVAILABLE"
                }, { status: 503 });
            }
            throw asrError;
        }

        if (!asrRes.ok) {
            console.error("[Ultra] ASR failed:", await asrRes.text());
            return NextResponse.json({ error: "ASR failed" }, { status: 500 });
        }

        const asrJson = await asrRes.json();
        const transcribedText = asrJson.text?.trim() || "";
        const asrEnd = Date.now();
        timings.asr = asrEnd - asrStart;
        console.log(`[Ultra] [T+${asrEnd - startTime}ms] ASR done: "${transcribedText}" (${timings.asr}ms)`);

        if (!transcribedText) {
            return NextResponse.json({ error: "No speech detected" }, { status: 400 });
        }

        // Build voice prompt with Hinglish instructions
        const systemPrompt = buildVoicePrompt(bot);

        // Create streaming response for sentence-by-sentence audio
        const encoder = new TextEncoder();
        const requestStartTime = startTime; // Capture for closure

        const stream = new ReadableStream({
            async start(controller) {
                const llmStart = Date.now();
                console.log(`[Ultra] [T+${llmStart - requestStartTime}ms] Sending to LLM...`);

                try {
                    // Call LLM with streaming
                    const llmRes = await fetch(`${VLLM_API_URL}/v1/chat/completions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            model: VLLM_MODEL,
                            messages: [
                                { role: "system", content: systemPrompt },
                                ...history.slice(-2),
                                { role: "user", content: transcribedText },
                            ],
                            max_tokens: 100, // Reduced for shorter responses
                            temperature: 0.7,
                            stream: true,
                        }),
                    });

                    const llmConnected = Date.now();
                    console.log(`[Ultra] [T+${llmConnected - requestStartTime}ms] LLM connected (${llmConnected - llmStart}ms)`);

                    if (!llmRes.ok || !llmRes.body) {
                        throw new Error("LLM failed");
                    }

                    const reader = llmRes.body.getReader();
                    const decoder = new TextDecoder();
                    let fullText = "";
                    let processedUpTo = 0;
                    let sentenceCount = 0;
                    let firstSentenceTime = 0;

                    // Send initial metadata
                    controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({
                        transcribedText,
                        asrTime: timings.asr
                    })}\n\n`));

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

                        for (const line of lines) {
                            const jsonStr = line.slice(6);
                            if (jsonStr === "[DONE]") continue;
                            try {
                                const json = JSON.parse(jsonStr);
                                const content = json.choices?.[0]?.delta?.content || "";
                                fullText += content;
                            } catch { }
                        }

                        // Check for new sentences to process
                        const unprocessed = fullText.substring(processedUpTo);
                        const sentences = extractSentences(unprocessed);

                        for (const sentence of sentences.complete) {
                            if (sentence.trim().length < 3) continue;

                            sentenceCount++;
                            const llmTime = Date.now() - llmStart;
                            if (sentenceCount === 1) {
                                firstSentenceTime = llmTime;
                                console.log(`[Ultra] [T+${Date.now() - requestStartTime}ms] First sentence ready (LLM: ${llmTime}ms): "${sentence}"`);
                            }

                            // TTS for this sentence
                            try {
                                const ttsStart = Date.now();
                                console.log(`[Ultra] [T+${ttsStart - requestStartTime}ms] Sending to TTS: "${sentence.substring(0, 30)}..."`);

                                const audioData = await textToSpeech(sentence);
                                const ttsEnd = Date.now();
                                const ttsTime = ttsEnd - ttsStart;
                                console.log(`[Ultra] [T+${ttsEnd - requestStartTime}ms] TTS done (${ttsTime}ms)`);

                                // Send audio chunk as base64
                                const base64Audio = Buffer.from(audioData).toString("base64");
                                controller.enqueue(encoder.encode(`event: audio\ndata: ${JSON.stringify({
                                    sentence,
                                    audio: base64Audio,
                                    sentenceNum: sentenceCount,
                                    llmTime,
                                    ttsTime
                                })}\n\n`));

                                console.log(`[Ultra] Sent sentence ${sentenceCount}: "${sentence.substring(0, 30)}..." (TTS: ${ttsTime}ms)`);
                            } catch (e) {
                                console.error(`[Ultra] TTS failed for sentence:`, e);
                            }

                            processedUpTo += sentence.length;
                        }

                        // Update processedUpTo for partial matches
                        if (sentences.complete.length > 0) {
                            processedUpTo = fullText.length - sentences.remaining.length;
                        }
                    }

                    // Process any remaining text
                    const remaining = fullText.substring(processedUpTo).trim();
                    if (remaining.length > 3) {
                        sentenceCount++;
                        try {
                            const ttsStart = Date.now();
                            const audioData = await textToSpeech(remaining);
                            const ttsTime = Date.now() - ttsStart;

                            const base64Audio = Buffer.from(audioData).toString("base64");
                            controller.enqueue(encoder.encode(`event: audio\ndata: ${JSON.stringify({
                                sentence: remaining,
                                audio: base64Audio,
                                sentenceNum: sentenceCount,
                                llmTime: Date.now() - llmStart,
                                ttsTime
                            })}\n\n`));

                            console.log(`[Ultra] Sent final: "${remaining.substring(0, 30)}..."`);
                        } catch (e) {
                            console.error(`[Ultra] TTS failed for remaining:`, e);
                        }
                    }

                    // Send done event
                    const totalTime = Date.now() - startTime;
                    controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
                        totalTime,
                        firstSentenceTime,
                        fullText,
                        sentenceCount
                    })}\n\n`));

                    console.log(`[Ultra] ✅ TOTAL: ${totalTime}ms | First: ${firstSentenceTime}ms | Sentences: ${sentenceCount}`);

                } catch (error: any) {
                    console.error("[Ultra] Stream error:", error);
                    controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({
                        error: error.message
                    })}\n\n`));
                }

                controller.close();
            }
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Transcribed-Text": encodeURIComponent(transcribedText),
            },
        });

    } catch (error: any) {
        console.error("[Ultra] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Text to Speech helper
async function textToSpeech(text: string): Promise<ArrayBuffer> {
    let ttsRes = await fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            input: text,
            voice: KOKORO_TTS_VOICE,
            speed: 1.1,
        }),
    });

    // Fallback to /synthesize
    if (!ttsRes.ok) {
        ttsRes = await fetch(`${KOKORO_TTS_URL}/synthesize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: text,
                voice: KOKORO_TTS_VOICE,
                speed: 1.1,
            }),
        });
    }

    if (!ttsRes.ok) {
        throw new Error("TTS failed: " + await ttsRes.text());
    }

    return await ttsRes.arrayBuffer();
}

// Extract complete sentences from text
function extractSentences(text: string): { complete: string[]; remaining: string } {
    const sentences: string[] = [];
    let remaining = text;

    // Match sentences ending with . ! ? । , :
    // But require at least 5 characters and space/end after punctuation
    const regex = /^(.+?[.!?।,:])(\s+|$)/;

    while (true) {
        const match = remaining.match(regex);
        if (!match) break;

        const sentence = match[1].trim();
        if (sentence.length >= 3) {
            sentences.push(sentence);
        }
        remaining = remaining.substring(match[0].length);
    }

    return { complete: sentences, remaining };
}

function buildVoicePrompt(bot: any): string {
    const name = bot.name || "Assistant";
    const directive = (bot.directive || "").trim().slice(0, 150);
    const knowledgeBrief = bot.voice_knowledge_brief || extractKeyFacts(bot.knowledge_base || "", 200);

    const voiceInstructions = `
CRITICAL VOICE MODE INSTRUCTIONS:
- You are in REAL-TIME VOICE conversation. Your response will be streamed to text-to-speech.
- RESPOND IMMEDIATELY with a SHORT answer (1-2 sentences max).
- Start your response with the most important word or phrase FIRST.
- Respond in ENGLISH only.

FORMATTING RULES:
- Use simple, spoken language. No technical jargon.
- NO markdown, NO bullet points, NO numbered lists, NO special formatting.
- NO emojis, NO asterisks, NO code blocks.
- Use punctuation (. or ,) frequently so audio can start playing early.
- Be warm, friendly, and conversational like a helpful assistant.
`.trim();

    return [
        `You are ${name}, a voice assistant.`,
        directive || "Be helpful and friendly.",
        knowledgeBrief ? `Key facts: ${knowledgeBrief}` : "",
        voiceInstructions
    ].filter(Boolean).join("\n\n");
}

function extractKeyFacts(text: string, maxChars: number): string {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim().slice(0, maxChars);
}
