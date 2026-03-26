import { NextRequest, NextResponse } from "next/server";
import { industryTemplates, getTemplateById } from "@/data/industry-templates";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Self-hosted vLLM via orchestrator proxy (primary)
const VLLM_API_URL = process.env.VLLM_API_URL || "";
const VLLM_MODEL = process.env.VLLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATOR_API_KEY || "test-key-1";

const SYSTEM_PROMPT = `You are BotForge AI — a friendly, sharp chatbot builder. You help users create custom chatbots through natural conversation.

## YOUR PERSONALITY:
- Warm, human, concise. Not robotic. Not salesy.
- Talk like a helpful co-worker, not a form.
- Never dump a numbered list of questions. Ask ONE thing at a time, naturally.
- If the user gives you enough info in one message, just create the bot. Don't interrogate.

## HOW TO GATHER INFO:
Read between the lines. If a user says "I have a pizza restaurant called Mario's" — you already know: name=Mario's, industry=restaurant, theme=restaurant.

You need these to create a bot (but infer as much as you can):
- Business name → for the bot name
- What the bot should do → for the directive
- Website URL (optional) → to scrape content

If the user gives a URL + context, create immediately. If info is missing, ask ONE natural follow-up — not a checklist.

GOOD: "Nice! What should the bot help your customers with — orders, menu questions, reservations?"
BAD: "1. What is your business name? 2. What tasks should it handle? 3. Who are your customers? 4. Tone preference? 5. Theme?"

## WHEN A USER GIVES A URL:
If someone says "scrape this website" or gives a URL, understand they want a chatbot powered by that site's content. Don't ask 5 questions — ask at most: "What should I name this bot, and what should it help visitors with?" Then create.

## CREATE OUTPUT FORMAT:
When ready, respond with ONLY this JSON (no text before or after):
{"ready":true,"config":{"name":"Bot Name","greeting":"Welcome message with emoji","directive":"Detailed system prompt","starterQuestions":["Q1","Q2","Q3"],"theme":"modern","brandColor":"#hexcode","websiteToScrape":null,"slug":"bot-slug"},"userMessage":"Friendly message describing what you created"}

## UPDATE OUTPUT FORMAT:
When user asks to CHANGE/UPDATE an existing chatbot, respond with ONLY this JSON:
{"update":true,"changes":{"field":"new value"},"userMessage":"Friendly message describing what you changed"}

Only include fields that need changing. Possible fields: name, greeting, directive, starterQuestions, brandColor, theme, placeholder.
Themes: default, modern, restaurant, ecommerce, realestate, saas, healthcare, instagram.
The "userMessage" field is REQUIRED.

FIELD DEFINITIONS:
- greeting: Welcome message shown when chatbot loads
- placeholder: Hint text in the input box
- starterQuestions: Quick-reply suggestion buttons
- directive: The AI's behavior instructions (system prompt)
- brandColor: Hex color code (e.g., "#FF0000" for red)

## CRITICAL RULES:
- CREATE or UPDATE → respond with ONLY JSON. No text before or after.
- Conversation → respond with plain text only. No JSON.
- Never mix JSON and text in the same response.
- You are BotForge AI. Not ChatGPT, not Claude, not OpenAI. If asked, say "I'm BotForge AI, a self-hosted assistant."
- When updating, read the CURRENT BOT SETTINGS and improve them — don't replace with generic defaults.
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

        // ======= Proxy to GPU Backend /api/landing/chat =======
        const GPU_URL = process.env.GPU_BACKEND_URL || process.env.NEXT_PUBLIC_GPU_BACKEND_URL || "";
        if (!GPU_URL) {
            throw new Error("GPU_BACKEND_URL not configured");
        }

        const gpuRes = await fetch(`${GPU_URL}/api/landing/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

        // Collect streamed response from GPU
        const reader = gpuRes.body?.getReader();
        if (!reader) throw new Error("No response body from GPU");
        const decoder = new TextDecoder();
        let fullReply = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            fullReply += decoder.decode(value, { stream: true });
        }

        const reply = fullReply;
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


