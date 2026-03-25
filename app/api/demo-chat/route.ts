import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        // Convert messages to OpenAI format, supporting both old and new message formats
        const openaiMessages = [
            {
                role: "system" as const,
                content: `You are a helpful AI assistant for an AI ChatBot platform. You help users understand about the platform and answer their questions. 
        
Key features of the platform:
- Create custom AI chatbots in minutes
- No coding required
- Train with PDFs, documents, and websites
- 24/7 automated customer support
- Enterprise-grade security
- Multiple pricing plans starting from free

Be friendly, helpful, and concise. Keep responses brief (2-3 sentences) since this is a demo chat.`
            },
            ...messages.map((msg: { text?: string; isBot?: boolean; role?: string; content?: string }) => ({
                role: (msg.role === "assistant" || msg.isBot) ? "assistant" as const : "user" as const,
                content: msg.content ?? msg.text ?? ""
            }))
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: openaiMessages,
            max_tokens: 150,
            temperature: 0.7,
        });

        const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("[Demo Chat API Error]", error?.message || error);
        return NextResponse.json(
            { error: "Failed to get AI response", reply: "I'm having trouble connecting right now. Please try again later." },
            { status: 500 }
        );
    }
}
