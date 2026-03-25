import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";

export const runtime = "nodejs";

type SaveBody = {
  userId?: string;
  chatbotId?: string;
  inputType?: "text" | "pdf";
  data?: string; // raw text if inputType=text, or base64 PDF content if inputType=pdf
  fileName?: string;
};

// Paragraph-aware chunking targeting ~300-500 words per chunk
function chunkTextByWords(text: string, minWords = 300, maxWords = 500): string[] {
  const clean = text.replace(/\u0000/g, "").replace(/\r/g, "");
  const paragraphs = clean.split(/\n\s*\n+/);
  const chunks: string[] = [];
  let buf: string[] = [];
  let words = 0;

  const flush = () => {
    if (buf.length) {
      chunks.push(buf.join("\n\n").trim());
      buf = [];
      words = 0;
    }
  };

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const wlen = trimmed.split(/\s+/).filter(Boolean).length;
    if (words + wlen > maxWords && words >= minWords) {
      flush();
    }
    buf.push(trimmed);
    words += wlen;
    if (words >= maxWords) flush();
  }
  flush();

  if (chunks.length === 0 && clean.trim()) {
    const all = clean.trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < all.length; i += maxWords) {
      chunks.push(all.slice(i, i + maxWords).join(" "));
    }
  }
  return chunks.filter(Boolean);
}

function decodeBase64Pdf(input: string): Buffer {
  const base64 = input.includes(",") ? input.split(",").pop() || "" : input;
  const normalized = base64.replace(/\s+/g, "");
  return Buffer.from(normalized, "base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveBody;
    const { userId, chatbotId, inputType, data } = body;
    const fileName = (body.fileName || (inputType === "pdf" ? "upload.pdf" : "manual.txt")).slice(0, 255);

    if (!userId || !chatbotId || !inputType || typeof data !== "string") {
      return NextResponse.json({ error: "Missing userId, chatbotId, inputType, or data" }, { status: 400 });
    }
    if (inputType !== "text" && inputType !== "pdf") {
      return NextResponse.json({ error: "Invalid inputType. Expected 'text' or 'pdf'" }, { status: 400 });
    }

    // Extract text
    let text = "";
    if (inputType === "text") {
      text = data.replace(/\u0000/g, "").trim();
    } else {
      try {
        const buffer = decodeBase64Pdf(data);
        const pdfParse = require("pdf-parse/lib/pdf-parse");
        const result = await pdfParse(buffer, { max: 0 });
        text = String(result?.text || "").trim();
      } catch (e: any) {
        console.error("PDF parse error", e);
        return NextResponse.json({ error: "Failed to extract text from PDF: " + (e?.message || "Unknown error") }, { status: 422 });
      }
    }

    if (!text) {
      return NextResponse.json({ error: "No text content to process" }, { status: 422 });
    }

    // Chunk
    const chunks = chunkTextByWords(text, 300, 500);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No meaningful content after chunking" }, { status: 422 });
    }

    // Batch create knowledge chunks on GPU backend
    // GPU backend handles embedding generation on-GPU + FAISS insertion automatically
    const result = await gpu.knowledge.createBatch(
      chatbotId,
      chunks.map((content) => ({
        content,
        type: inputType === "pdf" ? "pdf" : "text",
        source_title: fileName,
        source_id: fileName,
        token_count: content.split(/\s+/).length,
      }))
    );

    return NextResponse.json({ ok: true, chunks: chunks.length, inserted: result.count });
  } catch (err: any) {
    console.error("KNOWLEDGE SAVE ERROR", err);
    return NextResponse.json({ error: err?.message || "Save failed" }, { status: 500 });
  }
}
