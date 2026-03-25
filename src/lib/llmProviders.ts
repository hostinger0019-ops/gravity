// LLM Providers Library - Ollama, KoboldCpp, and Groq integration
// Provides unified interface for calling local GPU-accelerated LLMs and cloud APIs

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const KOBOLDCPP_API_URL = process.env.KOBOLDCPP_API_URL || "http://localhost:5001";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1";

export type LLMProvider = "ollama" | "koboldcpp" | "openai" | "deepseek" | "groq";

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface LLMResponse {
    content: string;
    provider: LLMProvider;
    model?: string;
}

// Ollama chat completion
export async function callOllama(
    messages: ChatMessage[],
    model: string = "llama3.1:8b"
): Promise<LLMResponse> {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages,
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: data.message?.content || "",
        provider: "ollama",
        model,
    };
}

// Ollama streaming chat (returns ReadableStream)
export async function callOllamaStream(
    messages: ChatMessage[],
    model: string = "llama3.1:8b"
): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages,
            stream: true,
        }),
    });

    if (!response.ok || !response.body) {
        throw new Error(`Ollama streaming error: ${response.status}`);
    }

    // Transform Ollama's NDJSON stream to plain text stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await reader.read();
            if (done) {
                controller.close();
                return;
            }

            const chunk = decoder.decode(value, { stream: true });
            // Ollama returns NDJSON - each line is a JSON object
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        controller.enqueue(new TextEncoder().encode(json.message.content));
                    }
                } catch {
                    // Skip malformed lines
                }
            }
        },
    });
}

// KoboldCpp chat completion (OpenAI-compatible API)
export async function callKoboldCpp(
    messages: ChatMessage[],
    model: string = "llama3-8b"
): Promise<LLMResponse> {
    const response = await fetch(`${KOBOLDCPP_API_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 1024,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new Error(`KoboldCpp API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: data.choices?.[0]?.message?.content || "",
        provider: "koboldcpp",
        model,
    };
}

// KoboldCpp streaming chat
export async function callKoboldCppStream(
    messages: ChatMessage[],
    model: string = "llama3-8b"
): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${KOBOLDCPP_API_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 1024,
            temperature: 0.7,
            stream: true,
        }),
    });

    if (!response.ok || !response.body) {
        throw new Error(`KoboldCpp streaming error: ${response.status}`);
    }

    // Transform SSE stream to plain text
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await reader.read();
            if (done) {
                controller.close();
                return;
            }

            const chunk = decoder.decode(value, { stream: true });
            // OpenAI-style SSE format: data: {...}
            const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

            for (const line of lines) {
                const jsonStr = line.slice(6); // Remove "data: "
                if (jsonStr === "[DONE]") continue;

                try {
                    const json = JSON.parse(jsonStr);
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                } catch {
                    // Skip malformed lines
                }
            }
        },
    });
}

// Groq chat completion (OpenAI-compatible API - very fast!)
export async function callGroq(
    messages: ChatMessage[],
    model: string = "llama-3.1-8b-instant"
): Promise<LLMResponse> {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not configured");
    }

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 512,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: data.choices?.[0]?.message?.content || "",
        provider: "groq",
        model,
    };
}

// Groq streaming chat (OpenAI-compatible SSE)
export async function callGroqStream(
    messages: ChatMessage[],
    model: string = "llama-3.1-8b-instant"
): Promise<ReadableStream<Uint8Array>> {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY not configured");
    }

    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 512,
            temperature: 0.7,
            stream: true,
        }),
    });

    if (!response.ok || !response.body) {
        throw new Error(`Groq streaming error: ${response.status}`);
    }

    // Transform SSE stream to plain text
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await reader.read();
            if (done) {
                controller.close();
                return;
            }

            const chunk = decoder.decode(value, { stream: true });
            // OpenAI-style SSE format: data: {...}
            const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

            for (const line of lines) {
                const jsonStr = line.slice(6); // Remove "data: "
                if (jsonStr === "[DONE]") continue;

                try {
                    const json = JSON.parse(jsonStr);
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                } catch {
                    // Skip malformed lines
                }
            }
        },
    });
}

// Check if provider is available (with timeout to prevent hanging)
export async function checkProviderHealth(provider: LLMProvider): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    try {
        if (provider === "groq") {
            // Groq is cloud-based, just check if API key is set
            clearTimeout(timeoutId);
            return !!GROQ_API_KEY;
        }
        if (provider === "ollama") {
            const url = process.env.OLLAMA_API_URL || "http://localhost:11434";
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        if (provider === "koboldcpp") {
            const url = process.env.KOBOLDCPP_API_URL || "http://localhost:5001";
            const response = await fetch(`${url}/api`, {
                method: "GET",
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        clearTimeout(timeoutId);
        return false;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

// Get best available provider for voice chat
export async function getBestVoiceProvider(): Promise<LLMProvider> {
    // Prefer Groq for voice (extremely fast - ~100ms response time)
    if (await checkProviderHealth("groq")) {
        return "groq";
    }
    // Fallback to local providers
    if (await checkProviderHealth("ollama")) {
        return "ollama";
    }
    if (await checkProviderHealth("koboldcpp")) {
        return "koboldcpp";
    }
    // Fallback to OpenAI
    return "openai";
}
