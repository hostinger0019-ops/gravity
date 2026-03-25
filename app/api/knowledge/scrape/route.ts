import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gpu } from "@/lib/gpuBackend";
import { SCRAPER } from "@/scraper/config";
import { analyzeText } from "@/scraper/llm";
import { extractProducts, extractWithLLM } from "@/scraper/ecommerce";
import { extractClean, smartChunk, shouldSkipUrl } from "@/scraper/extract";
import Bottleneck from "bottleneck";
import robotsParser from "robots-parser";
import { URL } from "node:url";
import crypto from "node:crypto";

export const runtime = "nodejs";

type Body = {
  userId?: string;
  chatbotId?: string;
  url?: string;
  urls?: string[];  // Specific URLs from sitemap selection (skips BFS)
  depth?: number;
  maxPages?: number;
  ingest?: boolean;
  extractProducts?: boolean;
};

async function getRobots(base: string) {
  if (!SCRAPER.respectRobots) return { isAllowed: () => true } as const;
  try {
    const robotsUrl = new URL("/robots.txt", base).toString();
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": SCRAPER.userAgent },
      signal: AbortSignal.timeout(SCRAPER.requestTimeoutMs),
    });
    const txt = res.ok ? await res.text() : "";
    const rp = robotsParser(robotsUrl, txt);
    return { isAllowed: (u: string) => rp.isAllowed(u, SCRAPER.userAgent) !== false } as const;
  } catch {
    return { isAllowed: () => true } as const;
  }
}

function sameDomain(u: string, origin: string) {
  try { return new URL(u).hostname === new URL(origin).hostname; } catch { return false; }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { url, chatbotId } = body;
    const specificUrls = body.urls || [];
    const maxPages = Math.min(specificUrls.length || Number(body.maxPages ?? SCRAPER.maxPages), 500);

    if (!chatbotId) return NextResponse.json({ error: "Missing chatbotId" }, { status: 400 });
    if (!url && specificUrls.length === 0) return NextResponse.json({ error: "Missing url or urls" }, { status: 400 });

    // ── GPU delegation: use Puppeteer workers on GPU (handles JS-heavy sites) ──
    const GPU_BACKEND = process.env.GPU_BACKEND_URL || process.env.GPU_BACKEND;
    if (GPU_BACKEND) {
      try {
        const gpuRes = await fetch(`${GPU_BACKEND}/api/scrape/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatbot_id: chatbotId,
            url: url || null,
            urls: specificUrls.length > 0 ? specificUrls : null,
            max_pages: maxPages,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (gpuRes.ok) {
          const result = await gpuRes.json();
          return NextResponse.json({
            ok: true,
            job_id: result.job_id,
            status: "queued",
            message: "Scrape job sent to GPU workers. Pages will be processed in background.",
            processed: 0,
            ingestedChunks: 0,
            extractedProducts: 0,
          });
        }
        console.warn("[Scrape] GPU delegation failed, falling back to local scraper:", gpuRes.status);
      } catch (gpuErr) {
        console.warn("[Scrape] GPU unreachable, falling back to local scraper:", gpuErr);
      }
    }

    // ── Fallback: original local Next.js scraper ──
    const depth = specificUrls.length > 0 ? 0 : Number(body.depth ?? 2);
    const ingest = !!body.ingest;
    const shouldExtractProducts = body.extractProducts !== false;

    const seedUrl = url || specificUrls[0];
    const seed = new URL(seedUrl);
    const robots = await getRobots(seed.origin);


    // If specific URLs provided (from sitemap), use them directly. Otherwise BFS.
    const queue: { url: string; depth: number }[] = specificUrls.length > 0
      ? specificUrls.map((u) => ({ url: u, depth: 0 }))
      : [{ url: seed.href, depth: 0 }];
    const visited = new Set<string>();
    const limiter = new Bottleneck({ minTime: SCRAPER.perDomainDelayMs, maxConcurrent: SCRAPER.maxConcurrency });

    let processed = 0;
    let ingestedChunks = 0;
    let extractedProductsCount = 0;
    let isEcommerceSite = false;

    while (queue.length > 0 && processed < maxPages) {
      const item = queue.shift();
      if (!item) break;
      const { url: pageUrl, depth: d } = item;
      if (visited.has(pageUrl)) continue;
      visited.add(pageUrl);

      // Skip junk URLs (login, terms, pagination, file downloads)
      if (shouldSkipUrl(pageUrl)) continue;
      if (SCRAPER.sameDomainOnly && !sameDomain(pageUrl, seed.href)) continue;
      if (!robots.isAllowed(pageUrl)) continue;

      await limiter.schedule(async () => {
        try {
          // Fetch with timeout
          const res = await fetch(pageUrl, {
            headers: { "User-Agent": SCRAPER.userAgent, Accept: "text/html,application/xhtml+xml" },
            signal: AbortSignal.timeout(SCRAPER.requestTimeoutMs),
          });

          // Skip non-HTML responses
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
            return;
          }

          const status = res.status;
          const html = res.ok ? await res.text() : "";
          if (!html) return;

          const etag = res.headers.get("etag") || null;
          const lastModified = res.headers.get("last-modified") || null;

          // --- Clean extraction (replaces old $("body").text()) ---
          const extraction = extractClean(html, pageUrl);
          const { title, fullText, sections, links, images, jsonLdProducts } = extraction;

          const contentHash = crypto.createHash("sha256").update(fullText).digest("hex");
          // Only call LLM when ingesting AND page has enough content (saves cost + time)
          const wordCount = fullText.split(/\s+/).filter(Boolean).length;
          // Skip LLM summary for product/listing pages — raw chunks are more accurate
          // and hallucination risk on prices/stock is high. Only summarize rich content
          // pages (homepage, about, blog, docs) where condensing adds real value.
          const isProductPage = (() => {
            try { return extractProducts(html, pageUrl).products.length > 0; } catch { return false; }
          })();
          const llm = (ingest && wordCount >= 100 && !isProductPage)
            ? await analyzeText(fullText)
            : { summary: null };

          // Store page via GPU backend
          let pageId: string;
          try {
            const pageResult = await gpu.pages.create({
              chatbot_id: chatbotId,    // ← fixes chatbot_id = null bug
              url: pageUrl,
              status_code: status,
              etag,
              last_modified: lastModified,
              content_hash: contentHash,
              title: title || extraction.ogTitle || "",
              text: fullText,
              metadata: {
                chatbotId,
                products: jsonLdProducts,
                og: {
                  image: extraction.ogImage,
                  title: extraction.ogTitle,
                  description: extraction.ogDescription,
                },
              },
              llm_summary: llm.summary,
            });
            pageId = pageResult.id;
          } catch (e: any) {
            console.error("PAGE UPSERT ERROR", { url: pageUrl, error: e?.message });
            throw e;
          }

          // --- Knowledge ingestion with smart chunking ---
          if (ingest && fullText && fullText.trim().length > 50) {
            // Delete old chunks for this URL before re-ingesting (deduplication)
            try {
              await gpu.knowledge.deleteBySource(chatbotId, pageUrl);
            } catch {
              // May not exist, that's fine
            }

            // Smart chunk: split by headings, add context prefixes, overlap
            const chunks = smartChunk(
              title || extraction.ogTitle || new URL(pageUrl).hostname,
              sections,
              { minWords: 100, maxWords: 400, maxChars: 4000, overlapSentences: 2 }
            );

            // Also ingest LLM summary as a high-quality chunk
            if (llm.summary && llm.summary.length > 50) {
              chunks.push({
                content: `[${title || "Page Summary"}]\n${llm.summary}`,
                wordCount: llm.summary.split(/\s+/).length,
              });
            }

            if (chunks.length) {
              try {
                const result = await gpu.knowledge.createBatch(
                  chatbotId,
                  chunks.map((chunk) => ({
                    content: chunk.content,
                    type: "scrape",
                    source_title: (title || new URL(pageUrl).hostname || "scrape") + ".html",
                    source_id: pageUrl,
                    token_count: chunk.wordCount,
                  }))
                );
                ingestedChunks += result.count;
              } catch (e) {
                console.error("INGEST ERROR", (e as any)?.message || e);
              }
            }
          }

          // E-commerce product extraction (HTML only — no LLM to prevent hallucination)
          if (shouldExtractProducts && html) {
            try {
              const eResult = extractProducts(html, pageUrl);
              if (eResult.isEcommerce) {
                isEcommerceSite = true;
                console.log(`[ECOMMERCE] Detected ${eResult.platform || "custom"} site, found ${eResult.products.length} products`);
              }

              const eProducts = eResult.products; // No LLM fallback — HTML extraction only

              if (eProducts.length > 0) {
                try {
                  // Upload product images to GPU backend for stable serving
                  // This replaces the original external URL with a GPU-hosted URL
                  const productsWithGpuImages = await Promise.all(
                    eProducts.map(async (product) => {
                      if (!product.imageUrl) return product;
                      try {
                        const gpuImageUrl = await gpu.assets.uploadFromUrl(product.imageUrl, chatbotId);
                        return { ...product, imageUrl: gpuImageUrl };
                      } catch {
                        // GPU upload failed — drop the image entirely (no external URLs)
                        return { ...product, imageUrl: null };
                      }
                    })
                  );

                  const batchPayload = productsWithGpuImages.map((product) => {
                    const searchText = `${product.name} ${product.description || ""} ${product.category || ""} ${product.brand || ""}`.trim();
                    return {
                      name: product.name,
                      description: product.description || null,
                      price: product.price || null,
                      original_price: product.originalPrice || null,
                      currency: product.currency || "USD",
                      category: product.category || null,
                      brand: product.brand || null,
                      sku: product.sku || null,
                      image_url: product.imageUrl || null,
                      image_urls: product.imageUrls || [],
                      stock_status: product.stockStatus || "in_stock",
                      rating: product.rating || null,
                      review_count: product.reviewCount || 0,
                      variants: product.variants || [],
                      url: product.url,
                      source_platform: eResult.platform || product.sourcePlatform || null,
                      raw_json: product.rawJson || null,
                      search_text: searchText,
                      tags: [],
                      attributes: {},
                    };
                  });
                  const batchResult = await gpu.products.createBatch(chatbotId, batchPayload);
                  extractedProductsCount += batchResult.count;

                  // Also create per-product knowledge chunks — one clean chunk per product
                  // This allows vector search to find individual products accurately
                  if (ingest) {
                    const productChunks = eProducts.map((product) => {
                      const currencySymbol = product.currency === "GBP" ? "£" :
                        product.currency === "EUR" ? "€" :
                          product.currency === "INR" ? "₹" : "$";
                      const lines = [
                        `[Product] ${product.name}`,
                        product.price != null ? `Price: ${currencySymbol}${product.price}` : null,
                        product.stockStatus ? `Availability: ${product.stockStatus === "in_stock" ? "In Stock" : "Out of Stock"}` : null,
                        product.rating != null ? `Rating: ${product.rating}/5` : null,
                        product.description ? `Description: ${product.description.slice(0, 200)}` : null,
                        product.brand ? `Brand: ${product.brand}` : null,
                        product.category ? `Category: ${product.category}` : null,
                        product.imageUrl ? `Image: ${product.imageUrl}` : null,
                        `URL: ${product.url}`,
                      ].filter(Boolean);
                      return {
                        content: lines.join("\n"),
                        type: "scrape",
                        source_title: `${product.name}.product`,
                        source_id: product.url,
                        token_count: lines.join("\n").split(/\s+/).length,
                      };
                    });

                    try {
                      const chunkResult = await gpu.knowledge.createBatch(chatbotId, productChunks);
                      ingestedChunks += chunkResult.count;
                    } catch (chunkErr) {
                      console.error("PRODUCT CHUNK ERROR", (chunkErr as any)?.message);
                    }
                  }
                } catch (productError) {
                  console.error("PRODUCT BATCH ERROR", { url: pageUrl, error: (productError as any)?.message });
                }
              }
            } catch (ecommerceError) {
              console.error("ECOMMERCE EXTRACTION ERROR", { url: pageUrl, error: (ecommerceError as any)?.message });
            }
          }

          // Download and upload images to GPU backend (parallel, 5 at a time)
          let pageUploadedImages = 0;
          const PARALLEL_BATCH = 5;
          for (let i = 0; i < images.length; i += PARALLEL_BATCH) {
            const batch = images.slice(i, i + PARALLEL_BATCH);
            const results = await Promise.allSettled(
              batch.map(async (img) => {
                const imgRes = await fetch(img.src, {
                  headers: { "User-Agent": SCRAPER.userAgent },
                  signal: AbortSignal.timeout(10000),
                });
                if (!imgRes.ok) return;
                const imgContentType = imgRes.headers.get("content-type") || "";
                if (!imgContentType.startsWith("image/")) return;
                const imgBuf = Buffer.from(await imgRes.arrayBuffer());
                if (imgBuf.length > 10 * 1024 * 1024) return; // skip > 10MB
                if (imgBuf.length < 1000) return; // skip tiny images (icons/tracking pixels)

                await gpu.assets.upload(imgBuf, {
                  pageId: pageId,
                  sourceUrl: img.src,
                  chatbotId,
                  contentType: imgContentType,
                });
                return true;
              })
            );
            pageUploadedImages += results.filter(r => r.status === "fulfilled" && r.value).length;
          }

          processed += 1;

          // Queue discovered links (filtered)
          if (d < depth) {
            for (const link of links) {
              if (!visited.has(link) && !shouldSkipUrl(link)) {
                queue.push({ url: link, depth: d + 1 });
              }
            }
          }

          console.log(`[${processed}/${maxPages}] ${status} ${pageUrl} (${sections.length} sections, ${images.length} imgs, ${pageUploadedImages} uploaded)`);
        } catch (e: any) {
          if (e?.name === "TimeoutError" || e?.name === "AbortError") {
            console.error(`TIMEOUT fetching ${pageUrl}`);
          } else {
            console.error("SCRAPE PAGE ERROR", { url: pageUrl, error: e?.message || String(e) });
          }
        }
      });
    }

    return NextResponse.json({
      ok: true,
      processed,
      ingestedChunks,
      extractedProducts: extractedProductsCount,
      isEcommerceSite,
    });
  } catch (err: any) {
    console.error("KNOWLEDGE SCRAPE ERROR", err);
    return NextResponse.json({ error: err?.message || "Scrape failed" }, { status: 500 });
  }
}
