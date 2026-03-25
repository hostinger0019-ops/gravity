export type BotLike = { name: string; directive?: string | null; knowledge_base?: string | null };

export function truncate(s: string = "", max = 8000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) : s;
}

export function buildSystemPrompt(bot: BotLike) {
  const parts: string[] = [];
  const directive = (bot.directive || "").trim();
  const isExamTutor = /iit|jee|neet|olympiad|competition/i.test(directive);

  // ── Identity ──
  parts.push(`You are ${bot.name || "an assistant"}.`);

  // ── User's custom instructions ──
  parts.push(directive || "Be a helpful, friendly assistant.");

  // ── Static knowledge base (if any) ──
  const kb = (bot.knowledge_base || "").trim();
  if (kb) parts.push(`Context:\n${truncate(kb, 8000)}`);

  // ── Response Style: fast first sentence for low-latency streaming ──
  parts.push([
    "RESPONSE FORMAT:",
    "- ALWAYS start your reply with a short, relevant intro sentence (e.g. 'Here are some great options!' or 'Sure, let me help with that.').",
    "- Then provide the detailed answer.",
    "- Keep responses concise and well-structured. Use bullet points or numbered lists for multiple items.",
    "- Never start with 'As an AI...' or similar disclaimers.",
  ].join("\n"));

  // ── How to use knowledge and product context ──
  parts.push([
    "USING KNOWLEDGE & PRODUCTS:",
    "- When Knowledge Context, Website Pages, or Products data appears in this conversation, ALWAYS use it to answer.",
    "- Extract exact prices, stock status, ratings, and details from the context — present them clearly.",
    "- If multiple products match, list all with prices and details.",
    "- NEVER invent product names, prices, ratings, or URLs that are not in the provided data.",
    "- Only say you don't have information if it is genuinely absent from ALL provided context.",
    "- When showing products, format each as: name, price, rating (if available), stock status.",
    "- Do NOT generate [PRODUCT_IMAGE:...] tags or markdown image links. The system handles images automatically.",
  ].join("\n"));

  // ── Safety ──
  parts.push("Refuse harmful, illegal, or inappropriate requests.");

  // ── Math/Science formatting (only for exam-tutor bots) ──
  if (isExamTutor) {
    parts.push([
      "MATH & SCIENCE FORMAT:",
      "1. Restate the problem briefly.",
      "2. List Given/Data/Assumptions.",
      "3. Show a Step-by-Step derivation with LaTeX: inline $a^2+b^2=c^2$ or block $$...$$ for multi-line.",
      "4. End with $$\\boxed{ANSWER}$$.",
      "5. Calibrate for IIT-JEE Advanced: algebraic manipulation, limits, series, calculus.",
    ].join("\n"));
  }

  return parts.filter(Boolean).join("\n\n");
}
