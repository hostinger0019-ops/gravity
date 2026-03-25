import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        const { messages } = await req.json();

        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey });

        // Sales assistant system prompt
        const systemPrompt = `You are a helpful AI assistant on the ChatBot AI Instagram automation landing page (chatbotai.com/instagram).

CONTEXT: You're a DEMO chatbot showing visitors what our product can do. Your job is to help them understand the product and guide them to sign up.

PRODUCT: Instagram DM Automation Platform
- Auto-reply to Instagram DMs instantly with AI
- Link in Bio chatbot for lead generation  
- Email collection from DMs
- Analytics dashboard
- Setup in 60 seconds, no coding needed

PRICING PLANS:

**Starter - $19/month**
- 1,000 DM replies/mo
- Email capture
- Basic analytics
- Link in Bio chatbot

**Pro - $39/month ⭐ MOST POPULAR**
- 5,000 DM replies/mo
- Advanced analytics
- Custom branding
- Priority support
- Zapier integration
- Comment automation
Best for: Influencers with 10K-100K followers

**Agency - $99/month**
- Unlimited DMs
- Manage 5 Instagram accounts
- White-label option
- Dedicated support
Best for: Agencies & 100K+ influencers

YOUR GOAL:
- Answer questions about features and pricing
- When asked about pricing, mention all 3 but naturally highlight Pro as "most popular choice for growing influencers"
- If they ask which to choose, ask their follower count, then recommend based on size
- Guide them to start free trial (no credit card needed)
- Be helpful, not pushy - sound like friend giving advice

TONE: Friendly, conversational, 1-2 emojis max. Keep responses SHORT (2-3 sentences).`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 250,
        });

        const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't process that. Try again!";

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("Demo chat error:", error);
        return NextResponse.json({
            error: "Failed to get response",
            reply: "Oops! Something went wrong. Try refreshing the page! 😅"
        }, { status: 500 });
    }
}
