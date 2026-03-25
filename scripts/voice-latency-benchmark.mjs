/**
 * Voice Latency Benchmark Script
 * 
 * Tests the voice-ultra endpoint and measures latency at each stage.
 * 
 * Usage: node scripts/voice-latency-benchmark.mjs [--endpoint=/api/voice-ultra]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:4010";
const ENDPOINT = process.argv.find((a) => a.startsWith("--endpoint="))?.split("=")[1] || "/api/voice-ultra";
const BOT_SLUG = process.env.BOT_SLUG || "default";
const NUM_TESTS = parseInt(process.env.NUM_TESTS || "3");

// Create a small test audio file (silence)
function createTestAudio() {
    // Minimal WebM audio file (1 second of silence would be here in production)
    // For testing, we create a tiny valid audio
    const wavHeader = Buffer.alloc(44);
    // RIFF header
    wavHeader.write("RIFF", 0);
    wavHeader.writeUInt32LE(36, 4); // file size - 8
    wavHeader.write("WAVE", 8);
    // fmt chunk
    wavHeader.write("fmt ", 12);
    wavHeader.writeUInt32LE(16, 16); // chunk size
    wavHeader.writeUInt16LE(1, 20); // PCM
    wavHeader.writeUInt16LE(1, 22); // mono
    wavHeader.writeUInt32LE(16000, 24); // sample rate
    wavHeader.writeUInt32LE(32000, 28); // byte rate
    wavHeader.writeUInt16LE(2, 32); // block align  
    wavHeader.writeUInt16LE(16, 34); // bits per sample
    // data chunk
    wavHeader.write("data", 36);
    wavHeader.writeUInt32LE(0, 40); // data size

    return wavHeader;
}

async function runBenchmark() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("           Voice Latency Benchmark");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`URL: ${BASE_URL}${ENDPOINT}`);
    console.log(`Bot: ${BOT_SLUG}`);
    console.log(`Tests: ${NUM_TESTS}`);
    console.log("───────────────────────────────────────────────────────────");

    // Check endpoint health
    try {
        const healthRes = await fetch(`${BASE_URL}${ENDPOINT}`);
        const health = await healthRes.json();
        console.log("✓ Endpoint healthy:", health.status || "ok");
    } catch (e) {
        console.error("✗ Endpoint not responding. Is the server running?");
        console.error(`  Run: npm run dev`);
        process.exit(1);
    }

    console.log("───────────────────────────────────────────────────────────");

    const results = [];
    const testAudio = createTestAudio();

    // For a real test, you'd need an actual audio file with speech
    // Check if test audio exists
    const testAudioPath = path.join(__dirname, "test-audio.webm");
    let audioBlob;
    if (fs.existsSync(testAudioPath)) {
        audioBlob = new Blob([fs.readFileSync(testAudioPath)]);
        console.log("Using test audio file:", testAudioPath);
    } else {
        console.log("No test audio file found at:", testAudioPath);
        console.log("Create a short audio recording and save it as scripts/test-audio.webm");
        console.log("For now, testing with minimal audio (may return 'no speech' error)");
        audioBlob = new Blob([testAudio], { type: "audio/wav" });
    }

    for (let i = 0; i < NUM_TESTS; i++) {
        console.log(`\nTest ${i + 1}/${NUM_TESTS}:`);

        const startTime = Date.now();

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "test.webm");
            formData.append("slug", BOT_SLUG);
            formData.append("language", "en");
            formData.append("history", "[]");

            const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
                method: "POST",
                body: formData,
            });

            const totalTime = Date.now() - startTime;

            if (!response.ok) {
                const error = await response.json();
                console.log(`  ✗ Failed: ${error.error || response.status}`);
                continue;
            }

            // Parse timings from headers
            const timingsHeader = response.headers.get("X-Timings");
            const timings = timingsHeader ? JSON.parse(timingsHeader) : {};

            const transcript = decodeURIComponent(response.headers.get("X-Transcribed-Text") || "");
            const responseText = decodeURIComponent(response.headers.get("X-Response-Text") || "");

            console.log(`  ✓ Total: ${totalTime}ms`);
            console.log(`    ASR: ${timings.asr || "?"}ms`);
            console.log(`    LLM (first): ${timings.llmFirstSentence || timings.llmTotal || "?"}ms`);
            console.log(`    TTS: ${timings.tts || "?"}ms`);
            console.log(`    Text: "${transcript}" → "${responseText?.slice(0, 50)}..."`);

            results.push({
                total: totalTime,
                asr: timings.asr || 0,
                llm: timings.llmFirstSentence || timings.llmTotal || 0,
                tts: timings.tts || 0,
            });

        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
        }

        // Small delay between tests
        await new Promise(r => setTimeout(r, 500));
    }

    // Calculate averages
    if (results.length > 0) {
        console.log("\n═══════════════════════════════════════════════════════════");
        console.log("                    Results Summary");
        console.log("═══════════════════════════════════════════════════════════");

        const avg = {
            total: Math.round(results.reduce((a, r) => a + r.total, 0) / results.length),
            asr: Math.round(results.reduce((a, r) => a + r.asr, 0) / results.length),
            llm: Math.round(results.reduce((a, r) => a + r.llm, 0) / results.length),
            tts: Math.round(results.reduce((a, r) => a + r.tts, 0) / results.length),
        };

        console.log(`\nAverage Latency (${results.length} tests):`);
        console.log(`  ├─ ASR:   ${avg.asr}ms`);
        console.log(`  ├─ LLM:   ${avg.llm}ms`);
        console.log(`  ├─ TTS:   ${avg.tts}ms`);
        console.log(`  └─ TOTAL: ${avg.total}ms`);

        const target = 1000;
        if (avg.total <= target) {
            console.log(`\n✅ SUCCESS: Average ${avg.total}ms is under ${target}ms target!`);
        } else {
            console.log(`\n⚠️  Average ${avg.total}ms exceeds ${target}ms target by ${avg.total - target}ms`);
        }
    }
}

runBenchmark().catch(console.error);
