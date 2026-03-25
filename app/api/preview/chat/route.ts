import { NextResponse, type NextRequest } from "next/server";
import OpenAI from "openai";
import { isDeepSeekModel, isGroqModel, normalizeGroqModel, normalizeOpenAIModel } from "@/lib/modelProvider";
import { buildSystemPrompt } from "@/lib/prompt";
import { gpu } from "@/lib/gpuBackend";
import { extractIntent, formatProductsForLLM } from "@/lib/intentExtractor";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const { bot, messages } = (await req.json()) as {
      bot: {
        name: string;
        directive?: string;
        knowledge_base?: string;
        model?: string;
        temperature?: number;
        // Pass-through of builder rules for preview-only behavior
        rules?: { settings?: { knowledge_fallback_mode?: "ai" | "message"; knowledge_fallback_message?: string } };
        chatbotId?: string;
      };
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    };
    if (!bot?.name || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Debug: Log raw rules received from client
    console.log('[Preview API] Raw bot.rules received:', JSON.stringify(bot.rules, null, 2));

    // Clean up message history: strip base64 images from older messages to reduce token usage
    const cleanedMessages = messages.map((msg, idx) => {
      if (msg.role === "user" && idx < messages.length - 1 && typeof msg.content === "string") {
        const cleaned = msg.content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[image removed]');
        return { ...msg, content: cleaned };
      }
      return msg;
    });
    // Extract images from the last user message to support vision prompts
    function extractTextAndImages(markdown: string) {
      const images: string[] = [];
      let text = String(markdown || "");
      // Markdown images
      text = text.replace(/!\[[^\]]*?\]\((.*?)\)/g, (_m, url) => {
        const u = String(url || "").trim();
        if (u) images.push(u);
        return ""; // remove from text content
      });
      // Raw data URI occurrences
      const dataUriRe = /(data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+)(?![A-Za-z0-9+/=])/gi;
      text = text.replace(dataUriRe, (u) => {
        images.push(u);
        return "";
      });
      text = text.replace(/\n{3,}/g, "\n\n").trim();
      return { text, images };
    }

    // Extract settings for knowledge fallback behavior
    const settings = bot?.rules?.settings || {};
    const fbMode = settings?.knowledge_fallback_mode as undefined | "ai" | "message";
    const fbMessage = String(settings?.knowledge_fallback_message || "").trim();

    const system = buildSystemPrompt({
      name: bot.name,
      directive: bot.directive,
      knowledge_base: bot.knowledge_base,
    });

    // Retrieval for preview when chatbotId is provided: GPU FAISS vector search + full-text pages + product search
    let knowledgeSystemMessage: { role: "system"; content: string } | null = null;
    let pageSystemMessage: { role: "system"; content: string } | null = null;
    let productSystemMessage: { role: "system"; content: string } | null = null;
    let retrievalAttempted = false;
    let retrievedCount = 0;

    const latestUser = [...cleanedMessages].reverse().find((m) => m.role === "user");
    if (bot.chatbotId && latestUser?.content) {
      // Extract intent from user message (regex — <1ms, zero cost)
      const intent = extractIntent(latestUser.content);

      // Run all searches in parallel for zero extra latency
      const [knowledgeResults, pagesResults, productResults] = await Promise.allSettled([
        // 1. Knowledge vector search (always)
        (async () => {
          retrievalAttempted = true;
          return gpu.knowledge.search(bot.chatbotId!, latestUser.content, 5);
        })(),
        // 2. Full-text page search (always)
        gpu.pages.search(bot.chatbotId!, latestUser.content, 3).catch(() => []),
        // 3. Product search (only if intent detected)
        intent.needsProductSearch
          ? gpu.products.search(bot.chatbotId!, {
            query: intent.productParams.query || intent.productParams.category,
            min_price: intent.productParams.minPrice,
            max_price: intent.productParams.maxPrice,
            category: intent.productParams.category,
            in_stock: intent.productParams.inStock,
            limit: intent.productParams.limit || 10,
          }).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Process knowledge results
      if (knowledgeResults.status === "fulfilled" && knowledgeResults.value?.length) {
        retrievedCount = knowledgeResults.value.length;
        const ctx = knowledgeResults.value
          .map((s: any, i: number) => `# Source ${i + 1}${s.source_title ? ` (${s.source_title})` : ""}\n${s.content}`)
          .join("\n\n---\n\n");
        knowledgeSystemMessage = { role: "system", content: `Knowledge Context (most relevant chunks):\n${ctx.slice(0, 8000)}` };
      }

      // Process page results
      if (pagesResults.status === "fulfilled") {
        const pages = pagesResults.value;
        if (Array.isArray(pages) && pages.length) {
          const pagesCtx = pages
            .map((p: any, i: number) => `# Page ${i + 1}: ${p.title || p.url}\nURL: ${p.url}\nSnippet: ${p.snippet}`)
            .join("\n\n---\n\n");
          pageSystemMessage = { role: "system", content: `Website Pages Context:\n${pagesCtx.slice(0, 4000)}` };
        }
      }

      // Process product results (structured data from database)
      if (productResults.status === "fulfilled") {
        const products = productResults.value;
        if (Array.isArray(products) && products.length) {
          const formatted = formatProductsForLLM(products);
          productSystemMessage = {
            role: "system",
            content: `${formatted}\n\nIMPORTANT: These are the EXACT products from the database matching the user's filters. Present ONLY these products. Do NOT invent, guess, or add any products not in this list. Include prices, ratings, and stock status as shown.`,
          };
        }
      }
    }

    // Honor fallback setting when no knowledge is found
    const hasStaticKnowledge = bot?.knowledge_base && String(bot.knowledge_base).trim();
    const noKnowledgeFound = !hasStaticKnowledge && !knowledgeSystemMessage && !pageSystemMessage;

    console.log('[Preview Knowledge Check]', {
      chatbotId: bot.chatbotId,
      fbMode,
      fbMessage: fbMessage ? `"${fbMessage.substring(0, 30)}..."` : '(empty)',
      retrievalAttempted,
      retrievedCount,
      hasStaticKnowledge: !!hasStaticKnowledge,
      noKnowledgeFound,
    });

    const shouldShowCustomMessage = fbMode === "message" && !!fbMessage && noKnowledgeFound;
    console.log('[Fallback Decision]', { shouldShowCustomMessage, fbMode, hasFbMessage: !!fbMessage, noKnowledgeFound });

    if (shouldShowCustomMessage) {
      console.log('[Fallback] Returning custom message:', fbMessage);
      return NextResponse.json({ reply: fbMessage });
    }
    if (!bot?.model && !apiKey) {
      const last = cleanedMessages[cleanedMessages.length - 1]?.content || "";
      const reply = `🧪 Mock preview reply (no OPENAI_API_KEY). Bot: ${bot.name}\nUser: ${last}`;
      return NextResponse.json({ reply });
    }

    // Prepare messages; if last user message contains images, build multi-part content for vision
    const last = cleanedMessages[cleanedMessages.length - 1];
    let visionParts: any[] | null = null;
    if (last?.role === "user") {
      const { text, images } = extractTextAndImages(last.content || "");
      if (images.length > 0) {
        visionParts = [
          { type: "text", text: text || "Please analyze the attached image(s) and answer the question." },
          ...images.slice(0, 3).map((url) => ({ type: "image_url", image_url: { url, detail: "auto" as const } })),
        ];
      }
    }
    const finalMessages = [
      { role: "system", content: system },
      ...(productSystemMessage ? [productSystemMessage] : []),
      ...(knowledgeSystemMessage ? [knowledgeSystemMessage] : []),
      ...(pageSystemMessage ? [pageSystemMessage] : []),
      ...cleanedMessages
    ].map((m, idx, arr) => {
      if (idx === cleanedMessages.length - 1 && m.role === "user" && visionParts) {
        return { role: "user", content: visionParts } as any;
      }
      return { role: (m as any).role, content: (m as any).content } as any;
    });

    // Groq API for Qwen and Groq Llama models
    if (isGroqModel(bot.model)) {
      if (!groqKey) return NextResponse.json({ error: "Server missing GROQ_API_KEY." }, { status: 500 });
      const groqModel = normalizeGroqModel(bot.model);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: "system", content: "Do not show your internal reasoning or thinking process. Only provide the final answer directly." },
            ...finalMessages
          ],
          temperature: Number(bot.temperature ?? 0.6),
          max_tokens: 2048,
        }),
      });
      if (!res.ok) throw new Error(`Groq error ${res.status}`);
      const data = await res.json();
      let reply = data?.choices?.[0]?.message?.content ?? "";

      // Filter out thinking blocks (reasoning models show internal thoughts)
      reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '');
      reply = reply.replace(/^(In the initial instructions|I should check|I need to make sure)[\s\S]*?(?=\n\n[A-Z]|\n\nYou are)/gim, '');
      reply = reply.trim();

      return NextResponse.json({ reply });
    } else if (isDeepSeekModel(bot.model)) {
      // DeepSeek route doesn't support image parts in this codepath; auto-switch to OpenAI if vision is needed
      if (visionParts && apiKey) {
        const openai = new OpenAI({ apiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: Number(bot.temperature ?? 0.6),
          messages: [{ role: "system", content: system }, ...finalMessages] as any,
        });
        const reply = completion.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ reply });
      }
      if (!deepseekKey) return NextResponse.json({ error: "Server missing DEEPSEEK_API_KEY." }, { status: 500 });
      const model = bot.model || "deepseek-reasoner";
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({ model, temperature: Number(bot.temperature ?? 0.6), messages: [{ role: "system", content: system }, ...finalMessages] }),
      });
      if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ reply });
    } else {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: visionParts ? "gpt-4o-mini" : normalizeOpenAIModel(bot.model),
        temperature: Number(bot.temperature ?? 0.6),
        messages: finalMessages,
      });
      const reply = completion.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ reply });
    }
  } catch (err: any) {
    console.error("PREVIEW CHAT ERROR", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
