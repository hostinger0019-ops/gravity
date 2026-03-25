import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export const runtime = "nodejs";

// Word-based chunker preferring paragraph boundaries, ~300-500 words per chunk
function chunkTextByWords(text: string, minWords = 300, maxWords = 500): string[] {
  const clean = text.replace(/\u0000/g, "").replace(/\r/g, "");
  const paragraphs = clean.split(/\n\s*\n+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let wordCount = 0;

  const flush = () => {
    if (current.length) {
      chunks.push(current.join("\n\n").trim());
      current = [];
      wordCount = 0;
    }
  };

  for (const p of paragraphs) {
    const w = p.trim().split(/\s+/).filter(Boolean);
    if (w.length === 0) continue;
    if (wordCount + w.length > maxWords && wordCount >= minWords) {
      flush();
    }
    current.push(p.trim());
    wordCount += w.length;
    if (wordCount >= maxWords) flush();
  }
  flush();

  if (chunks.length === 0 && clean.trim().length > 0) {
    const words = clean.trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i += maxWords) {
      const slice = words.slice(i, i + maxWords);
      chunks.push(slice.join(" "));
    }
  }

  return chunks.filter((c) => c.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const userId = String(form.get("userId") || "").trim();
    const chatbotId = String(form.get("chatbotId") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!userId || !chatbotId) {
      return NextResponse.json({ error: "Missing userId or chatbotId" }, { status: 400 });
    }

    const name = file.name || "upload.pdf";
    if (!name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 415 });
    }

    // 1) Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";
    try {
      const pdfParse = (await import("pdf-parse")).default as any;
      const result = await pdfParse(buffer);
      text = String(result?.text || "").trim();
    } catch (e: any) {
      console.error("PDF extract failed", e);
      return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 422 });
    }

    if (!text) {
      return NextResponse.json({ error: "No text extracted from PDF" }, { status: 422 });
    }

    // 2) Chunk
    const chunks = chunkTextByWords(text, 300, 500);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No meaningful content to chunk" }, { status: 422 });
    }

    // 3) Batch create knowledge chunks — GPU backend handles embedding on-GPU + FAISS
    const result = await gpu.knowledge.createBatch(
      chatbotId,
      chunks.map((content) => ({
        content,
        type: "pdf",
        source_title: name,
        source_id: name,
        token_count: content.split(/\s+/).length,
      }))
    );

    return NextResponse.json({
      ok: true,
      file: name,
      chunks: chunks.length,
      inserted: result.count,
    });
  } catch (err: any) {
    console.error("KNOWLEDGE UPLOAD ERROR", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
