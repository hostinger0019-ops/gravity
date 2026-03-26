import { NextRequest, NextResponse } from "next/server";
import { industryTemplates, getTemplateById } from "@/data/industry-templates";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Self-hosted vLLM via orchestrator proxy (primary)
const VLLM_API_URL = process.env.VLLM_API_URL || "";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATOR_API_KEY || "test-key-1";

const SYSTEM_PROMPT = `You are BotForge AI, a chatbot builder assistant powered by a self-hosted LLM. You are NOT ChatGPT, NOT Claude, NOT Anthropic, NOT OpenAI. You are BotForge's own AI assistant. If asked what model you are, say "I'm BotForge AI, a self-hosted assistant." Help users create and manage their chatbots.

## YOUR APPROACH:
1. ALWAYS ask at least 2-3 questions first to understand the user's needs
2. Gather information about their business, target audience, and specific requirements
3. Only create the chatbot AFTER you have enough details

## QUESTIONS TO ASK:
- What is the name of your business/brand? (for the chatbot name)
- What specific tasks should the chatbot handle? (for the directive)
- Who are your main customers? (for tone and language)
- Do you have a website to import content from? (optional)
- Any specific tone preference? (friendly, professional, casual)
- Which UI theme suits your brand? Available themes:
  • default — Clean minimal look
  • modern — Sleek dark modern UI
  • restaurant — Warm food & hospitality design
  • ecommerce — Shopping-focused with product cards
  • realestate — Property-focused elegant design
  • saas — Tech/startup onboarding style
  • healthcare — Medical-themed calming design
  • instagram — Social media DM-style interface

## WHEN TO CREATE:
Only create the chatbot when:
- User has answered at least 2 questions, OR
- User explicitly says "just create it" / "create now" / "that's enough"

## CREATE OUTPUT FORMAT:
When you have ENOUGH information to CREATE a new bot, respond with ONLY this JSON (no other text before or after):
{"ready":true,"config":{"name":"Bot Name","greeting":"Welcome message with emoji","directive":"Detailed system prompt","starterQuestions":["Q1","Q2","Q3"],"theme":"modern","brandColor":"#hexcode","websiteToScrape":null,"slug":"bot-slug"},"userMessage":"Friendly message describing what you created"}

## UPDATE OUTPUT FORMAT:
When user asks to CHANGE/UPDATE an existing chatbot, you MUST respond with ONLY this JSON (no other text before or after):
{"update":true,"changes":{"field":"new value"},"userMessage":"Friendly message describing what you changed"}

Only include the fields that need to be changed in "changes". Possible fields: name, greeting, directive, starterQuestions, brandColor, theme, placeholder.
For theme changes, valid values are: default, modern, restaurant, ecommerce, realestate, saas, healthcare, instagram.
The "userMessage" field is REQUIRED — this is what the user will see as your reply.

FIELD DEFINITIONS:
- greeting: The big welcome message shown when chatbot loads (e.g., "Welcome! You can ask me anything")
- placeholder: The hint text inside the input box where users type (e.g., "Send a message...", "Ask me anything...")
- starterQuestions: Quick reply buttons/suggestions shown to users
- directive: The AI's behavior instructions (system prompt)
- brandColor: Hex color code (e.g., "#FF0000" for red, "#3B82F6" for blue)

## EXAMPLES OF UPDATE REQUESTS AND RESPONSES:
- User: "Change the greeting to Hello there!" → {"update":true,"changes":{"greeting":"Hello there! 👋"},"userMessage":"I've updated the greeting to 'Hello there! 👋'"}
- User: "Make it more professional" → {"update":true,"changes":{"directive":"You are a professional business assistant..."},"userMessage":"I've updated the chatbot's tone to be more professional and formal."}
- User: "Change color to red" → {"update":true,"changes":{"brandColor":"#EF4444"},"userMessage":"I've changed the brand color to red!"}
- User: "Change starter questions to ask about pricing and support" → {"update":true,"changes":{"starterQuestions":["What are your prices?","I need support","Tell me about your services"]},"userMessage":"I've updated the starter questions to focus on pricing and support."}

## CRITICAL RULES:
- For CREATE or UPDATE, respond with ONLY JSON. No text before or after.
- For questions or conversation, respond with plain text only. No JSON.
- When updating, use the CURRENT BOT SETTINGS provided below to make informed changes. Improve upon existing values, don't replace them with generic ones.
- Do NOT mix JSON and text in the same response.
`;

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

When updating, improve upon these existing values. For example if user says "make it more professional", rewrite the EXISTING directive above in a professional tone — don't create a generic one.`;
        }

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

        // ======= Attempt 1: GPU Backend (handles vLLM routing internally) =======
        const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "";
        let response: Response | null = null;
        if (GPU_URL) {
            try {
                const gpuRes = await fetch(`${GPU_URL}/api/chat/stream`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: llmMessages, temperature: 0.7, max_tokens: 2000 }),
                });
                if (gpuRes.ok && gpuRes.body) {
                    // Collect streaming response into full text
                    const reader = gpuRes.body.getReader();
                    const decoder = new TextDecoder();
                    let fullText = "";
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        fullText += decoder.decode(value, { stream: true });
                    }
                    console.log(`[AI Generator] Using GPU backend, got ${fullText.length} chars`);
                    // Wrap in OpenAI-compatible format so existing parser works
                    const wrappedBody = JSON.stringify({ choices: [{ message: { content: fullText } }] });
                    response = new Response(wrappedBody, { status: 200, headers: { "Content-Type": "application/json" } });
                } else {
                    console.warn(`[AI Generator] GPU backend failed (${gpuRes.status}), falling back to Groq...`);
                    response = null;
                }
            } catch (e) {
                console.warn(`[AI Generator] GPU backend unreachable, falling back to Groq...`, e);
                response = null;
            }
        }

        // ======= Attempt 2: Groq fallback =======
        if (!response && GROQ_API_KEY) {
            for (const model of ["moonshotai/kimi-k2-instruct-0905", "llama-3.3-70b-versatile"]) {
                try {
                    response = await fetch(GROQ_API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
                        body: JSON.stringify({ model, messages: llmMessages, temperature: 0.7, max_tokens: 2000 }),
                    });
                    if (response.ok) { console.log(`[AI Generator] Groq fallback: ${model}`); break; }
                    console.warn(`[AI Generator] Groq ${model} failed (${response.status})`);
                } catch (e) {
                    console.warn(`[AI Generator] Groq ${model} error:`, e);
                }
            }
        }

        if (!response || !response.ok) {
            const err = response ? await response.json().catch(() => ({})) : {};
            throw new Error(err.error?.message || "All LLM providers failed");
        }

        const reply = (await response.json()).choices?.[0]?.message?.content || "";
        let parsed = parseJsonFromReply(reply);
        if (parsed?.config && templateId && templateId !== "custom") {
            const t = getTemplateById(templateId);
            if (t) parsed.config.theme = t.suggestedTheme;
        }
        return NextResponse.json({ reply: getFriendlyReply(reply, parsed), parsed });

    } catch (error: any) {
        console.error("AI Generator error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate" }, { status: 500 });
    }
}


