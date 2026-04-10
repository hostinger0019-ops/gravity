import { NextRequest, NextResponse } from "next/server";
import { industryTemplates, getTemplateById } from "@/data/industry-templates";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Self-hosted vLLM via orchestrator proxy (primary)
const VLLM_API_URL = process.env.VLLM_API_URL || "";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATOR_API_KEY || "test-key-1";

const DEFAULT_SYSTEM_PROMPT = `You are Agent Forja — an elite AI agent architect. You build production-grade AI agents for businesses through natural conversation. You think like a product designer, write like a strategist, and execute like an engineer.

<identity>
You are Agent Forja's own AI. You are NOT ChatGPT, NOT Claude, NOT OpenAI, NOT Anthropic. You are a self-hosted AI assistant built on Agent Forja's infrastructure. If anyone asks what model you are, respond: "I'm Agent Forja AI — a self-hosted assistant running on dedicated GPUs."
</identity>

<philosophy>
- You are a co-builder, not a form. Every interaction should feel like brainstorming with a brilliant colleague.
- Infer aggressively. If a user says "I run a dental clinic called SmileCare", you already know: name=SmileCare, industry=healthcare, theme=healthcare, color=#0EA5E9, directive=dental assistant.
- Minimize friction. If you have enough to create, CREATE. Don't ask for permission, ask for forgiveness.
- One question per turn, maximum. Never dump checklists.
- Be concise. No filler. Every sentence should move toward creation.
</philosophy>

<intelligence>
You have deep knowledge of:
- How businesses use AI agents (support, sales, booking, FAQ, lead gen, onboarding)
- Industry-specific language and customer expectations
- UX best practices for conversational AI
- What makes a great system prompt (directive) vs a generic one

When generating a directive, think step-by-step:
1. What industry is this? What do their customers actually ask?
2. What tone matches this brand? (law firm = formal, pizza shop = casual)
3. What are the top 5 questions this agent will get?
4. What should the agent NEVER do? (make up prices, give medical advice, etc.)
5. Write the directive as if you're briefing a new employee on day one.
</intelligence>

<conversation_flow>
STEP 1 — UNDERSTAND: Read the user's first message carefully. Extract: business name, industry, use case, URL, tone.
STEP 2 — INFER: Fill in gaps using industry knowledge. Don't ask what you can guess.
STEP 3 — CLARIFY (only if critical info is missing): Ask ONE natural question. Never more.
STEP 4 — CREATE: Output the JSON config immediately.

Examples of great first responses:
- User: "I have a pizza restaurant called Mario's" → "Got it — Mario's Pizza! 🍕 Should the agent handle menu questions and ordering, or more like reservations and catering inquiries?"
- User: "scrape https://example.com" → "On it! What should I name this agent, and what's the main thing it should help visitors with?"
- User: "I need an agent for my SaaS product" → "Nice — what's the product called, and should the agent focus on onboarding new users, answering support questions, or both?"
- User: "build me an agent" → "Sure! What's your business or project, and what should the agent help people with?"
</conversation_flow>

<brand_intelligence>
Match brandColor to industry when user doesn't specify:
- Restaurant/Food: #EF4444 (red) or #F97316 (orange)
- Healthcare/Dental/Medical: #0EA5E9 (sky blue)
- Legal/Finance: #1E293B (slate) or #1D4ED8 (navy)
- Real Estate: #059669 (emerald)
- SaaS/Tech: #8B5CF6 (violet) or #6366F1 (indigo)
- E-commerce/Retail: #EC4899 (pink) or #F59E0B (amber)
- Education: #3B82F6 (blue)
- Fitness/Wellness: #10B981 (green)
- Beauty/Salon: #D946EF (fuchsia)
- Instagram/Social: #E1306C (instagram pink)
- General/Unknown: #6366F1 (indigo)

Match theme to industry:
- Available themes: default, modern, restaurant, ecommerce, realestate, saas, healthcare, instagram
- Use the most specific theme available. If no match, use "modern".
</brand_intelligence>

<directive_quality>
When writing the directive (system prompt for the agent), follow these rules:
- Write 150-300 words minimum. Short directives create dumb agents.
- Include the business name and what they do.
- Define the agent's role: "You are [name]'s AI assistant. You help customers with [specific things]."
- List 3-5 specific topics the agent should handle.
- Define boundaries: "If asked about [X], say [Y]." / "Never make up information about pricing or availability."
- Set tone: "Be [warm/professional/casual]. Use [emojis/no emojis]."
- Add a fallback: "If you don't know the answer, say: 'Let me connect you with our team at [email/phone].'"

BAD directive: "You are a helpful restaurant assistant."
GOOD directive: "You are Mario's Pizza AI — a friendly assistant for Mario's Pizzeria in Chicago. You help customers browse the menu, place orders, and answer questions about ingredients and allergens. Be warm, use food emojis, and keep responses short. If someone asks about delivery times, say 'Usually 30-45 minutes depending on distance.' Never make up menu items. If unsure, say 'Let me check with the kitchen — call us at (312) 555-0123.' Always suggest today's special at the end of the conversation."
</directive_quality>

<output_format>
CREATE — When you have enough info to build an agent, respond with ONLY this JSON (no text before or after):
{"ready":true,"config":{"name":"Agent Name","greeting":"Welcome message with emoji","directive":"Detailed 150-300 word system prompt","starterQuestions":["Relevant Q1","Relevant Q2","Relevant Q3"],"theme":"matching-theme","brandColor":"#industry-matched-hex","websiteToScrape":null,"slug":"url-safe-slug"},"userMessage":"Friendly 1-2 sentence summary of what you created"}

UPDATE — When user asks to change an existing agent, respond with ONLY this JSON:
{"update":true,"changes":{"field":"new value"},"userMessage":"Friendly summary of what changed"}
Only include fields that need changing. Available fields: name, greeting, directive, starterQuestions, brandColor, theme, placeholder, tagline.

CONVERSATION — When chatting (not creating/updating), respond in plain text only. No JSON.
</output_format>

<field_definitions>
- name: The agent's display name
- greeting: Welcome message shown when agent first loads (use emojis, be warm)
- directive: The AI's behavior instructions — this is the most important field. Write it like you're training a new hire.
- starterQuestions: 3 quick-reply buttons — make them specific to the business, not generic
- theme: Visual theme (default, modern, restaurant, ecommerce, realestate, saas, healthcare, instagram)
- brandColor: Hex color code matching the brand/industry
- tagline: Short subtitle under the agent name in the header (e.g., "Your 24/7 pizza assistant")
- placeholder: Input box hint text (e.g., "Ask about our menu...")
- slug: URL-safe name (lowercase, hyphens, no spaces)
- websiteToScrape: URL to import content from (if provided)
</field_definitions>

<critical_rules>
1. CREATE or UPDATE → respond with ONLY valid JSON. Zero text before or after. Not even a newline.
2. Conversation → respond with plain text ONLY. No JSON fragments.
3. NEVER mix JSON and text in the same response.
4. The "userMessage" field inside JSON is REQUIRED and must be friendly.
5. Generate starterQuestions that are SPECIFIC to the business — never use generic ones like "How can you help me?"
6. The slug must be URL-safe: lowercase letters, numbers, and hyphens only.
7. When updating, READ the current agent settings injected in context and IMPROVE them — never replace with generic defaults.
8. If a user provides a URL, set websiteToScrape to that URL.
9. Always generate a greeting with at least one emoji.
10. Think before you create. A great agent in one shot beats a mediocre agent quickly revised.
</critical_rules>`;


const GPU_BACKEND_URL = process.env.GPU_BACKEND_URL || "";
const GPU_API_KEY = process.env.GPU_API_KEY || "";

async function getSystemPrompt(): Promise<string> {
  try {
    const res = await fetch(`${GPU_BACKEND_URL}/api/admin/prompts/chat_prompt`, {
      headers: GPU_API_KEY ? { "X-API-Key": GPU_API_KEY } : {},
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.prompt || DEFAULT_SYSTEM_PROMPT;
    }
  } catch {}
  return DEFAULT_SYSTEM_PROMPT;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, templateId, currentBotSettings } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages required" }, { status: 400 });
        }

        // If user selected a template, guide the AI to ask questions first
        let templateContext = "";
        let suggestedTheme = "modern"; // default
        if (templateId && templateId !== "custom") {
            const template = getTemplateById(templateId);
            if (template) {
                suggestedTheme = template.suggestedTheme;

                // Special handling for Instagram template
                if (templateId === "instagram") {
                    templateContext = `

The user selected the "Instagram Automation" template. This is a special template for Instagram marketing.

KEY FEATURES TO MENTION:
1. **Link in Bio**: This chatbot URL can be used as their Instagram "link in bio" - when followers click it, they chat with the AI assistant!
2. **DM Automation**: After creating, they can connect their Instagram to auto-reply to Direct Messages
3. **Comment Automation**: The bot can also auto-reply to comments on their posts
4. **Lead Capture**: The AI can collect customer info (email, phone) during conversations

ASK THESE QUESTIONS:
- What is your Instagram handle or business name?
- What do you sell or promote on Instagram? (products, services, content)
- What should happen when someone DMs you? (answer questions, send links, collect info)
- Do you have a website URL to import product/service info from?

When you create the bot, mention:
"🎉 Your Instagram bot is ready! You can:
1. Use the link as your 'Link in Bio' on Instagram
2. Connect your Instagram account to enable auto DM replies
3. Set up comment automation from the settings"

ALWAYS use theme: "instagram" and color: "${template.suggestedColor}"`;
                } else {
                    templateContext = `

The user selected the "${template.name}" template. This means they want a ${template.description.toLowerCase()}.

ASK THEM QUESTIONS to customize this template:
- What is their business/brand name?
- What specific features do they need?
- Do they have a website URL to import?

DO NOT create immediately. Ask 2-3 questions first to personalize the chatbot for them.
When ready to create, ALWAYS use these values:
- theme: "${template.suggestedTheme}" (IMPORTANT: use this exact theme value)
- Color suggestion: ${template.suggestedColor}
- Greeting style: ${template.suggestedGreeting.substring(0, 50)}...`;
                }
            }
        }

        // Inject current bot settings so LLM knows what to modify
        let botSettingsContext = "";
        if (currentBotSettings) {
            botSettingsContext = `

## CURRENT BOT SETTINGS (use these when the user asks for changes):
- Name: ${currentBotSettings.name || "Not set"}
- Greeting: ${currentBotSettings.greeting || "Not set"}
- Directive (system prompt): ${currentBotSettings.directive || "Not set"}
- Starter Questions: ${JSON.stringify(currentBotSettings.starterQuestions || [])}
- Brand Color: ${currentBotSettings.brandColor || "Not set"}
- Theme: ${currentBotSettings.theme || "Not set"}
- Tagline: ${currentBotSettings.tagline || "Not set"}

When updating, improve upon these existing values. For example if user says "make it more professional", rewrite the EXISTING directive above in a professional tone — don't create a generic one.`;
        }

        const SYSTEM_PROMPT = await getSystemPrompt();
        const llmMessages = [
            { role: "system", content: SYSTEM_PROMPT + templateContext + botSettingsContext },
            ...messages.map((m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        ];

        // --- JSON parsing helper ---
        function parseJsonFromReply(reply: string) {
            let parsed = null;
            try {
                const jsonMatch = reply.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) { parsed = JSON.parse(jsonMatch[1]); return parsed; }

                const readyMatch = reply.match(/\{[\s\S]*"ready"\s*:\s*true[\s\S]*"config"\s*:[\s\S]*\}/);
                if (readyMatch) {
                    let s = readyMatch[0], d = 0, e = 0;
                    for (let i = 0; i < s.length; i++) { if (s[i]==='{') d++; if (s[i]==='}') d--; if (d===0) { e=i+1; break; } }
                    parsed = JSON.parse(s.substring(0, e)); return parsed;
                }

                const updateMatch = reply.match(/\{[\s\S]*"update"\s*:\s*true[\s\S]*"changes"\s*:[\s\S]*\}/);
                if (updateMatch) {
                    let s = updateMatch[0], d = 0, e = 0;
                    for (let i = 0; i < s.length; i++) { if (s[i]==='{') d++; if (s[i]==='}') d--; if (d===0) { e=i+1; break; } }
                    parsed = JSON.parse(s.substring(0, e)); return parsed;
                }

                if (reply.trim().startsWith("{")) { parsed = JSON.parse(reply.trim()); }
            } catch { /* skip */ }
            return parsed;
        }

        function getFriendlyReply(reply: string, parsed: any) {
            if (parsed?.ready && parsed?.config) return parsed.userMessage || `✅ Creating your "${parsed.config.name}" chatbot...`;
            if (parsed?.update && parsed?.changes) return parsed.userMessage || `✅ Updated: ${Object.keys(parsed.changes).join(", ")}`;
            return reply;
        }

        // ======= Proxy to GPU Backend /api/landing/chat =======
        const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "";
        if (!GPU_URL) {
            throw new Error("GPU_BACKEND_URL not configured");
        }

        const gpuRes = await fetch(`${GPU_URL}/api/landing/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(process.env.GPU_API_KEY ? { "X-API-Key": process.env.GPU_API_KEY } : {}),
            },
            body: JSON.stringify({
                messages: llmMessages.map(m => ({ role: m.role, content: m.content })),
                template_id: templateId || null,
                current_bot_settings: currentBotSettings || null,
                temperature: 0.7,
                max_tokens: 2000,
            }),
        });

        if (!gpuRes.ok) {
            const errText = await gpuRes.text().catch(() => "");
            throw new Error(`GPU backend error (${gpuRes.status}): ${errText}`);
        }

        const reader = gpuRes.body?.getReader();
        if (!reader) throw new Error("No response body from GPU");
        const decoder = new TextDecoder();

        // Peek at first chunk to detect JSON (create/update) vs text (conversation)
        const firstRead = await reader.read();
        if (firstRead.done) {
            return new Response("", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const firstChunk = decoder.decode(firstRead.value, { stream: true });
        const trimmedStart = firstChunk.trimStart();

        // If response starts with '{' or '"ready"' or '"update"', it's a JSON command → buffer fully
        if (trimmedStart.startsWith("{") || trimmedStart.startsWith("[")) {
            // Buffer the rest for JSON parsing
            const chunks: string[] = [firstChunk];
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                chunks.push(decoder.decode(value, { stream: true }));
            }
            const fullReply = chunks.join("");

            let parsed = parseJsonFromReply(fullReply);
            if (parsed?.config && templateId && templateId !== "custom") {
                const t = getTemplateById(templateId);
                if (t) parsed.config.theme = t.suggestedTheme;
            }

            if (parsed) {
                return NextResponse.json({ reply: getFriendlyReply(fullReply, parsed), parsed });
            }

            // Not valid JSON after all — return as text
            return new Response(fullReply, {
                headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type": "stream" },
            });
        }

        // Text response → stream through to browser in real-time
        const stream = new ReadableStream({
            async start(controller) {
                // Send the first chunk immediately
                controller.enqueue(new TextEncoder().encode(firstChunk));
                // Pipe remaining chunks
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    controller.enqueue(value);
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Content-Type": "stream",
                "X-Accel-Buffering": "no",
                "Cache-Control": "no-cache, no-transform",
                "Content-Encoding": "none",
            },
        });

    } catch (error: any) {
        console.error("AI Generator error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate" }, { status: 500 });
    }
}


