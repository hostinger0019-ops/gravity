import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";
import { saveMemory, topSimilar } from "@/lib/chatMemory";
import { callLLM, providerFromModel } from "@/lib/llm";
import { extractIntent, formatProductsForLLM } from "@/lib/intentExtractor";

export const runtime = "nodejs";

type Body = { userId?: string; chatbotId?: string; question?: string; conversationId?: string };

export async function POST(req: NextRequest) {
  try {
    const { userId, chatbotId, question, conversationId } = (await req.json()) as Body;
    if (!userId || !chatbotId || !question) {
      return NextResponse.json({ error: "Missing userId, chatbotId, or question" }, { status: 400 });
    }

    // 1) Retrieve top similar chat memory (GPU handles embedding internally)
    let memoryContext = "";
    try {
      const mem = await topSimilar({ query: question, userId, chatbotId, conversationId, limit: 5 });
      if (mem?.length) {
        memoryContext = mem
          .map((m) => `${m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}: ${m.message}`)
          .join("\n");
      }
    } catch (e) {
      console.warn("chat_memory lookup failed", e);
    }

    // 2) Extract intent (regex — <1ms, zero cost)
    const intent = extractIntent(question);

    // 3) Run knowledge search + product search in parallel
    let top: Array<{ id: string; content: string; source_title?: string; similarity: number }> = [];
    let productContext = "";

    const [knowledgeResult, productResult] = await Promise.allSettled([
      gpu.knowledge.search(chatbotId, question, 3).catch(() => []),
      intent.needsProductSearch
        ? gpu.products.search(chatbotId, {
          query: intent.productParams.query || intent.productParams.category,
          min_price: intent.productParams.minPrice,
          max_price: intent.productParams.maxPrice,
          category: intent.productParams.category,
          in_stock: intent.productParams.inStock,
          limit: intent.productParams.limit || 10,
        }).catch(() => [])
        : Promise.resolve([]),
    ]);

    if (knowledgeResult.status === "fulfilled") {
      top = (knowledgeResult.value || []).map((r: any) => ({
        id: r.id,
        content: r.content,
        source_title: r.source_title,
        similarity: r.similarity,
      }));
    }

    if (productResult.status === "fulfilled") {
      const products = productResult.value;
      if (Array.isArray(products) && products.length) {
        productContext = formatProductsForLLM(products) +
          "\n\nIMPORTANT: Present ONLY these exact products from the database. Do NOT invent any.";
      }
    }

    // 4) Build context and call LLM
    const kbContext = top
      .map((t, i) => `# Source ${i + 1}${t.source_title ? ` (${t.source_title})` : ""}\n${t.content}`)
      .join("\n\n---\n\n");

    const system = `You are a helpful AI assistant. Use the provided knowledge context, product data, and relevant past chat messages to answer the user's question. If product data is provided, present ONLY those exact products. If the answer is not present in the context, say you don't have enough information rather than guessing.`;
    const user = `${memoryContext ? `Recent Relevant Messages:\n${memoryContext}\n\n` : ""}${productContext ? `${productContext}\n\n` : ""}${kbContext ? `Knowledge Context:\n${kbContext}\n\n` : ""}Question: ${question}`;

    // Determine model/provider for this chatbot
    let model = "gpt-4o";
    let temperature = 0.2;
    try {
      const bot = await gpu.chatbots.getById(chatbotId);
      if (bot?.model) model = String(bot.model);
      if (typeof bot?.temperature === "number") temperature = Number(bot.temperature);
    } catch { }

    let answer = "";
    try {
      answer = await callLLM({
        provider: providerFromModel(model),
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
      });
    } catch (e: any) {
      console.error("LLM call failed", e);
      return NextResponse.json({ error: e?.message || "LLM call failed" }, { status: 500 });
    }

    // 4) Save both question and answer to chat memory (GPU handles embedding)
    try {
      await saveMemory({ role: "user", message: question, userId, chatbotId, conversationId });
      if (answer) {
        await saveMemory({ role: "assistant", message: answer, userId, chatbotId, conversationId });
      }
    } catch (e) {
      console.warn("chat_memory save failed", e);
    }

    return NextResponse.json({
      ok: true,
      answer,
      top: top.map((t) => ({ id: t.id, file_name: t.source_title, similarity: t.similarity })),
    });
  } catch (err: any) {
    console.error("KNOWLEDGE QUERY ERROR", err);
    return NextResponse.json({ error: err?.message || "Query failed" }, { status: 500 });
  }
}
