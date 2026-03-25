import { NextResponse, type NextRequest } from "next/server";
import { getBotForPublic } from "@/data/runtime";
import { gpu } from "@/lib/gpuBackend";
import { LeadIntentDetector } from "@/lib/leadIntentDetector";

// Next.js 15: context params for dynamic routes are async
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    console.log("[Chat API] Request received, voiceMode:", body?.voiceMode);
    let messages = Array.isArray(body?.messages) ? body.messages as Array<{ role: "user" | "assistant" | "system"; content: string }> : [];

    // Clean up message history: strip base64 images from older messages to prevent token overflow
    messages = messages.map((msg, idx) => {
      if (msg.role === "user" && idx < messages.length - 1 && typeof msg.content === "string") {
        const cleaned = msg.content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[image removed]');
        return { ...msg, content: cleaned };
      }
      return msg;
    });

    // Enforce a max rolling memory of 14 messages (excluding system) server-side for safety
    if (messages.length > 14) messages = messages.slice(-14);
    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : undefined;
    const voiceMode = body?.voiceMode === true;

    const bot = await getBotForPublic(slug);
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // ============================================================================
    // LEAD CAPTURE INTENT DETECTION
    // ============================================================================
    let leadCaptureRequest = null;

    if (bot.lead_capture_enabled && bot.lead_capture_config?.trigger === 'during_chat') {
      const lastUserMessage = messages[messages.length - 1];

      if (lastUserMessage && lastUserMessage.role === 'user' && typeof lastUserMessage.content === 'string') {
        // Get last capture attempt for cooldown
        let lastAttempt: Date | undefined;
        if (conversationId) {
          try {
            const attempts = await gpu.leadCaptureAttempts.list(conversationId);
            if (Array.isArray(attempts) && attempts.length > 0) {
              lastAttempt = new Date(attempts[0].attempted_at);
            }
          } catch { }
        }

        // Detect intent
        const intent = LeadIntentDetector.detectIntent(
          lastUserMessage.content,
          messages,
          bot.lead_capture_config,
          lastAttempt
        );

        if (intent.shouldCapture) {
          // Record this attempt
          if (conversationId) {
            try {
              await gpu.leadCaptureAttempts.create({
                conversation_id: conversationId,
                trigger_type: intent.trigger_type,
              });
            } catch (err) {
              console.error('Failed to record lead capture attempt:', err);
            }
          }

          leadCaptureRequest = {
            trigger: true,
            reason: intent.reason,
            fields: bot.lead_capture_config.fields || ['email', 'name'],
            requiredFields: bot.lead_capture_config.requiredFields || ['email'],
            consentText: bot.lead_capture_config.consentText,
            successMessage: bot.lead_capture_config.successMessage || 'Thanks! How can I help you today?',
            skipAllowed: bot.lead_capture_config.skipAllowed || false,
            confidence: intent.confidence,
            trigger_type: intent.trigger_type,
          };
        }
      }
    }

    // ============================================================================
    // GPU STREAM PROXY — all AI logic handled by GPU backend
    // ============================================================================
    const gpuUrl = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "http://localhost:8000";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        let reply = "";

        try {
          // Single call to GPU — handles vLLM routing, product/knowledge search,
          // system prompt, Groq streaming, and conversation logging
          const gpuRes = await fetch(`${gpuUrl}/api/chat/stream`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatbot_id: bot.id,
              messages: messages.map(m => ({ role: m.role, content: String(m.content) })),
              conversation_id: conversationId || null,
              voice_mode: voiceMode,
            }),
          });

          if (!gpuRes.ok || !gpuRes.body) {
            const errText = await gpuRes.text().catch(() => "");
            console.error("[GPU Stream] Error:", gpuRes.status, errText);
            const fallbackMsg = "Sorry, I'm having trouble connecting. Please try again.";
            controller.enqueue(encoder.encode(fallbackMsg));
            reply = fallbackMsg;
          } else {
            // Stream GPU response directly to browser
            const reader = gpuRes.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              const text = decoder.decode(value, { stream: true });
              reply += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (e) {
          console.error("[GPU Stream] Connection error:", e);
          const errMsg = "Sorry, I encountered an error. Please try again.";
          controller.enqueue(encoder.encode(errMsg));
          reply = errMsg;
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Transfer-Encoding": "chunked",
        ...(leadCaptureRequest ? { "X-Lead-Capture": JSON.stringify(leadCaptureRequest) } : {}),
      },
    });
  } catch (err: any) {
    console.error("bots/[slug]/chat error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
