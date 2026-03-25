import { NextResponse } from "next/server";
import {
    callOllama,
    callOllamaStream,
    callKoboldCpp,
    callKoboldCppStream,
    callGroq,
    callGroqStream,
    getBestVoiceProvider,
    type ChatMessage,
    type LLMProvider,
} from "@/lib/llmProviders";

// System prompt for voice chat - optimized for concise, natural responses
function getVoiceSystemPrompt(lang: "en" | "hi" = "en"): string {
    if (lang === "hi") {
        return `आप एक helpful voice assistant हो। 
आपको short, natural और conversational replies देने हैं।
- Maximum 2-3 sentences में reply करो
- Simple Hinglish language use करो
- Technical jargon avoid करो
- Friendly और helpful रहो`;
    }

    return `You are a helpful voice assistant. 
Give short, natural, conversational responses.
- Reply in 2-3 sentences maximum
- Use simple, clear language
- Avoid technical jargon
- Be friendly and helpful`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            message,
            messages = [],
            lang = "en",
            provider: requestedProvider,
            stream = true, // Default to streaming for voice
        } = body as {
            message?: string;
            messages?: ChatMessage[];
            lang?: "en" | "hi";
            provider?: LLMProvider;
            stream?: boolean;
        };

        // Build messages array
        const chatMessages: ChatMessage[] = [
            { role: "system", content: getVoiceSystemPrompt(lang) },
            ...messages,
        ];

        // Add current message if provided
        if (message) {
            chatMessages.push({ role: "user", content: message });
        }

        // Determine provider - prefer Groq for voice (super fast)
        const provider = requestedProvider || (await getBestVoiceProvider());

        // Streaming response
        if (stream) {
            let streamResponse: ReadableStream<Uint8Array>;

            if (provider === "groq") {
                streamResponse = await callGroqStream(chatMessages);
            } else if (provider === "ollama") {
                streamResponse = await callOllamaStream(chatMessages);
            } else if (provider === "koboldcpp") {
                streamResponse = await callKoboldCppStream(chatMessages);
            } else {
                return NextResponse.json(
                    { error: "Streaming not supported for this provider" },
                    { status: 400 }
                );
            }

            return new Response(streamResponse, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Transfer-Encoding": "chunked",
                    "X-LLM-Provider": provider,
                },
            });
        }

        // Non-streaming response
        let result;

        if (provider === "groq") {
            result = await callGroq(chatMessages);
        } else if (provider === "ollama") {
            result = await callOllama(chatMessages);
        } else if (provider === "koboldcpp") {
            result = await callKoboldCpp(chatMessages);
        } else {
            return NextResponse.json(
                { error: "Provider not available" },
                { status: 503 }
            );
        }

        return NextResponse.json({
            reply: result.content,
            provider: result.provider,
            model: result.model,
        });
    } catch (error: any) {
        console.error("Voice Chat API Error:", error);
        return NextResponse.json(
            { error: error.message || "Voice chat failed" },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    const ollamaHealthy = await fetch(
        process.env.OLLAMA_API_URL || "http://45.143.122.8:11434"
    )
        .then((r) => r.ok)
        .catch(() => false);

    const koboldHealthy = await fetch(
        `${process.env.KOBOLDCPP_API_URL || "http://45.143.122.8:5001"}/api/v1/info`
    )
        .then((r) => r.ok)
        .catch(() => false);

    return NextResponse.json({
        ollama: ollamaHealthy,
        koboldcpp: koboldHealthy,
        recommended: ollamaHealthy ? "ollama" : koboldHealthy ? "koboldcpp" : "none",
    });
}
