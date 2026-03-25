import OpenAI from "openai";

function getClient() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (openaiKey) {
    return {
      provider: "openai" as const,
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
  if (deepseekKey) {
    return {
      provider: "deepseek" as const,
      client: new OpenAI({ apiKey: deepseekKey, baseURL: "https://api.deepseek.com" }),
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }
  return null;
}

export async function analyzeText(text: string) {
  const cfg = getClient();
  if (!cfg) return { summary: null as string | null };

  const prompt =
    "Summarize the main points of the page in 3-5 bullets and extract key metadata fields (title, topics). Return concise output.";
  const { client, model } = cfg;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant for web content analysis." },
      { role: "user", content: `${prompt}\n\nContent:\n${text.slice(0, 8000)}` },
    ],
    temperature: 0.2,
  });

  const content = resp.choices?.[0]?.message?.content ?? "";
  return { summary: content };
}
