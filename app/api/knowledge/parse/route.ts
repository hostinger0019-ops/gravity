import { NextRequest, NextResponse } from "next/server";

// POST /api/knowledge/parse — Parse uploaded files (PDF, TXT, CSV, etc.) and return text content
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        const results: { name: string; type: string; content: string; size: number }[] = [];

        for (const file of files) {
            const name = file.name;
            const type = file.type;
            const size = file.size;

            // Max 10MB per file
            if (size > 10 * 1024 * 1024) {
                results.push({ name, type, content: `[File too large: ${(size / 1024 / 1024).toFixed(1)}MB, max 10MB]`, size });
                continue;
            }

            try {
                if (type === "application/pdf") {
                    // PDF: extract text using pdf-parse if available, otherwise return placeholder
                    const buffer = Buffer.from(await file.arrayBuffer());
                    let text = "";
                    try {
                        // Try dynamic import of pdf-parse
                        const pdfParse = (await import("pdf-parse")).default;
                        const data = await pdfParse(buffer);
                        text = data.text || "";
                    } catch {
                        // Fallback: basic text extraction from PDF buffer
                        const str = buffer.toString("utf-8");
                        const textMatches = str.match(/\(([^)]+)\)/g);
                        if (textMatches) {
                            text = textMatches.map(m => m.slice(1, -1)).join(" ");
                        }
                        if (!text || text.length < 50) {
                            text = `[PDF file: ${name} - ${(size / 1024).toFixed(0)}KB. Install pdf-parse for full text extraction: npm install pdf-parse]`;
                        }
                    }
                    results.push({ name, type, content: text.trim(), size });

                } else if (
                    type === "text/plain" ||
                    type === "text/csv" ||
                    type === "text/markdown" ||
                    type === "application/json" ||
                    name.endsWith(".txt") ||
                    name.endsWith(".csv") ||
                    name.endsWith(".md") ||
                    name.endsWith(".json") ||
                    name.endsWith(".jsonl")
                ) {
                    // Text-based files
                    const text = await file.text();
                    results.push({ name, type, content: text.trim(), size });

                } else if (
                    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                    name.endsWith(".docx")
                ) {
                    // DOCX: basic extraction
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const str = buffer.toString("utf-8");
                    // Simple XML text extraction
                    const textContent = str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
                    const meaningful = textContent.length > 100 ? textContent : `[DOCX file: ${name} - ${(size / 1024).toFixed(0)}KB]`;
                    results.push({ name, type, content: meaningful, size });

                } else {
                    // Unsupported file type — still try text extraction
                    try {
                        const text = await file.text();
                        if (text && text.length > 10) {
                            results.push({ name, type, content: text.trim(), size });
                        } else {
                            results.push({ name, type, content: `[Unsupported file type: ${type || name}]`, size });
                        }
                    } catch {
                        results.push({ name, type, content: `[Could not read file: ${name}]`, size });
                    }
                }
            } catch (err: any) {
                results.push({ name, type, content: `[Error processing ${name}: ${err.message}]`, size });
            }
        }

        return NextResponse.json({ files: results });
    } catch (error: any) {
        console.error("Knowledge parse error:", error);
        return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
    }
}
