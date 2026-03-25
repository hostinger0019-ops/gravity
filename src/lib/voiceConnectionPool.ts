/**
 * Voice Service Connection Pool
 * 
 * Keeps connections warm to GPU services to eliminate cold start latency.
 * - Periodic health checks every 30s
 * - Pre-warmed connections
 * - Service availability checking
 */

const WHISPER_ASR_URL = process.env.WHISPER_ASR_URL || "http://localhost:8003";
const VLLM_API_URL = process.env.VLLM_API_URL || "http://localhost:8000";
const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "http://localhost:8001";

interface ServiceHealth {
    whisper: boolean;
    vllm: boolean;
    kokoro: boolean;
    lastCheck: number;
}

let healthCache: ServiceHealth = {
    whisper: false,
    vllm: false,
    kokoro: false,
    lastCheck: 0,
};

const HEALTH_CACHE_TTL = 30000; // 30 seconds

/**
 * Check if a service is available with timeout
 */
async function checkServiceWithTimeout(url: string, timeout: number = 2000): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            method: "GET",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

/**
 * Check health of all voice services
 */
export async function checkVoiceServices(): Promise<ServiceHealth> {
    // Return cached health if recent
    if (Date.now() - healthCache.lastCheck < HEALTH_CACHE_TTL) {
        return healthCache;
    }

    // Check all services in parallel
    const [whisper, vllm, kokoro] = await Promise.all([
        checkServiceWithTimeout(`${WHISPER_ASR_URL}/health`),
        checkServiceWithTimeout(`${VLLM_API_URL}/health`),
        checkServiceWithTimeout(`${KOKORO_TTS_URL}/health`),
    ]);

    healthCache = {
        whisper,
        vllm,
        kokoro,
        lastCheck: Date.now(),
    };

    return healthCache;
}

/**
 * Warmup voice services with lightweight requests
 */
export async function warmupVoiceServices(): Promise<void> {
    console.log("[VoicePool] Warming up services...");

    try {
        // Parallel warmup requests
        await Promise.allSettled([
            // Whisper - just health check
            fetch(`${WHISPER_ASR_URL}/health`, { method: "GET" }),

            // vLLM - tiny completion to warm up
            fetch(`${VLLM_API_URL}/v1/chat/completions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: process.env.VLLM_MODEL || "Qwen/Qwen2.5-32B-Instruct-AWQ",
                    messages: [{ role: "user", content: "Hi" }],
                    max_tokens: 1,
                }),
            }),

            // Kokoro - tiny TTS
            fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: ".",
                    voice: "af_bella",
                }),
            }),
        ]);

        console.log("[VoicePool] Services warmed up");
    } catch (error) {
        console.warn("[VoicePool] Warmup failed:", error);
    }
}

/**
 * Get service URLs for direct access
 */
export function getServiceUrls() {
    return {
        whisper: WHISPER_ASR_URL,
        vllm: VLLM_API_URL,
        kokoro: KOKORO_TTS_URL,
    };
}

/**
 * Prefetch audio for common greetings (optional optimization)
 */
const greetingCache = new Map<string, ArrayBuffer>();

export async function prefetchGreeting(text: string, voice: string = "af_bella"): Promise<void> {
    const key = `${text}_${voice}`;
    if (greetingCache.has(key)) return;

    try {
        const response = await fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: text, voice }),
        });

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            greetingCache.set(key, buffer);
            console.log(`[VoicePool] Prefetched: "${text}"`);
        }
    } catch {
        // Ignore prefetch failures
    }
}

export function getCachedGreeting(text: string, voice: string = "af_bella"): ArrayBuffer | undefined {
    return greetingCache.get(`${text}_${voice}`);
}

/**
 * Start periodic warmup (call this once at app startup)
 */
let warmupInterval: NodeJS.Timeout | null = null;

export function startPeriodicWarmup(intervalMs: number = 30000): void {
    if (warmupInterval) return;

    // Initial warmup
    warmupVoiceServices();

    // Periodic warmup
    warmupInterval = setInterval(() => {
        warmupVoiceServices();
    }, intervalMs);

    console.log(`[VoicePool] Started periodic warmup every ${intervalMs}ms`);
}

export function stopPeriodicWarmup(): void {
    if (warmupInterval) {
        clearInterval(warmupInterval);
        warmupInterval = null;
    }
}
