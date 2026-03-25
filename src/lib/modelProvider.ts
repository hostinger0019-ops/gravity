export function isDeepSeekModel(model?: string) {
  return !!model && model.startsWith("deepseek");
}

export function isGroqModel(model?: string) {
  return !!model && (model.startsWith("groq/") || model.startsWith("qwen2.5:"));
}

export function isQwenModel(model?: string) {
  return !!model && model.startsWith("qwen2.5:");
}

export function normalizeGroqModel(model?: string) {
  // Map our model IDs to actual Groq API names
  if (model?.startsWith("qwen2.5:")) {
    const size = model.split(":")[1]; // "72b", "14b", "7b"
    // Groq uses qwen/qwen3-32b format, not qwen2.5
    // Only 32b is available on Groq currently
    return "qwen/qwen3-32b";
  }
  // Groq models already have correct format
  if (model?.startsWith("groq/")) {
    return model.replace("groq/", ""); // Remove "groq/" prefix
  }
  return model || "llama-3.1-8b-instant";
}

export function normalizeOpenAIModel(model?: string) {
  // Map our labels to plausible API model ids
  switch (model) {
    case "gpt-4-turbo":
      return "gpt-4-turbo";
    case "gpt-5":
      return "gpt-5";
    case "gpt-5-mini":
      return "gpt-5-mini";
    case "gpt-5-nano":
      return "gpt-5-nano";
    case "gpt-4o":
      return "gpt-4o";
    case "gpt-4o-mini":
    default:
      return "gpt-4o-mini";
  }
}
