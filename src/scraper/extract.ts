/**
 * Clean Text Extraction & Smart Chunking
 * ========================================
 * Extracts clean, structured text from HTML for high-quality RAG ingestion.
 * 
 * Key improvements over raw $("body").text():
 * 1. Strips navigation, footers, cookie banners, scripts, ads
 * 2. Prefers <main>/<article> content over full <body>
 * 3. Preserves heading structure (H1-H6) for semantic chunking
 * 4. Splits into context-rich chunks with title + heading prefixes
 */

import { load as loadHTML, type CheerioAPI } from "cheerio";

// ─── Types ──────────────────────────────────────────────────────────

export interface Section {
    heading: string;
    level: number;         // 1-6 for H1-H6, 0 for no heading
    content: string;       // cleaned text under this heading
}

export interface CleanExtraction {
    title: string;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    sections: Section[];   // structured text split by headings
    fullText: string;      // all sections joined (clean, no junk)
    links: string[];
    images: { src: string }[];
    jsonLdProducts: any[];
}

export interface KnowledgeChunk {
    content: string;
    wordCount: number;
}

// ─── Product extraction result ───────────────────────────────────────

export interface ExtractedProduct {
    name: string;
    description?: string | null;
    price?: number | null;
    original_price?: number | null;
    currency?: string;
    image_url?: string | null;
    image_urls?: string[];
    brand?: string | null;
    category?: string | null;
    sku?: string | null;
    rating?: number | null;
    review_count?: number;
    stock_status?: string;
    tags?: string[];
    attributes?: Record<string, string>;
    url: string;
    source?: "json-ld" | "opengraph" | "html-pattern";
}

// ─── Selectors to remove ────────────────────────────────────────────

const JUNK_SELECTORS = [
    // Structural junk
    "nav", "footer", "header",
    "script", "style", "noscript", "iframe", "svg",
    // ARIA roles
    "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    "[role='complementary']", "[role='search']",
    // Cookie / consent
    "[class*='cookie']", "[id*='cookie']",
    "[class*='consent']", "[id*='consent']",
    "[class*='gdpr']", "[id*='gdpr']",
    // Ads + popups
    "[class*='advert']", "[class*='ad-']", "[class*='popup']",
    "[class*='modal']", "[class*='overlay']",
    // Social
    "[class*='social']", "[class*='share']", "[class*='follow']",
    // Chat widgets
    "[class*='chat-widget']", "[id*='intercom']", "[id*='crisp']",
    "[class*='livechat']", "[id*='hubspot']",
    // Misc noise
    "[class*='breadcrumb']", "[class*='pagination']",
    "[class*='sidebar']", "aside",
    "[class*='newsletter']", "[class*='subscribe']",
    "[aria-hidden='true']",
].join(", ");

// ─── URL helpers ────────────────────────────────────────────────────

function normalizeUrl(input: string, base: string): string | null {
    try { return new URL(input, base).toString().split("#")[0]; }
    catch { return null; }
}

// Patterns to skip during crawling
const SKIP_URL_PATTERNS = [
    /\/(login|signin|signup|register|auth|logout|account|checkout|cart)\b/i,
    /\/(terms|privacy|cookie|legal|disclaimer|refund|return-policy)\b/i,
    /\/(wp-admin|wp-login|admin|dashboard)\b/i,
    /[?&](sort|order|filter|page|p)=/i,
    /\.(pdf|zip|exe|dmg|apk|mp3|mp4|avi|mov|doc|docx|xls|xlsx|ppt)$/i,
    /\.(jpg|jpeg|png|gif|svg|webp|ico|bmp)$/i,
    /#/,
    /mailto:/i,
    /tel:/i,
    /javascript:/i,
];

export function shouldSkipUrl(url: string): boolean {
    return SKIP_URL_PATTERNS.some(p => p.test(url));
}

// ─── Main extraction ────────────────────────────────────────────────

export function extractClean(html: string, baseUrl: string): CleanExtraction {
    const $ = loadHTML(html);

    // --- Extract metadata BEFORE removing elements ---
    const title = $("title").first().text().trim();
    const ogTitle = $("meta[property='og:title']").attr("content") || null;
    const ogDescription = $("meta[property='og:description']").attr("content") || null;
    const ogImage = $("meta[property='og:image']").attr("content") || null;

    // --- Extract links BEFORE removing nav ---
    const links: string[] = [];
    $("a[href]").each((_: any, el: any) => {
        const u = normalizeUrl($(el).attr("href") || "", baseUrl);
        if (u) links.push(u);
    });

    // --- Extract images BEFORE removing elements ---
    const images: { src: string }[] = [];
    $("img[src]").each((_: any, el: any) => {
        const u = normalizeUrl($(el).attr("src") || "", baseUrl);
        if (u) images.push({ src: u });
    });

    // --- Extract JSON-LD products BEFORE removing scripts ---
    const jsonLdProducts: any[] = [];
    $("script[type='application/ld+json']").each((_: any, el: any) => {
        try {
            const raw = $(el).contents().text();
            const json = JSON.parse(raw);
            const items = Array.isArray(json) ? json : [json];
            for (const obj of items) {
                const g = obj?.["@graph"];
                const list = Array.isArray(g) ? g : [obj];
                for (const n of list) {
                    const type = n?.["@type"] || n?.type;
                    if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
                        const name = n.name || n.title || null;
                        const image = Array.isArray(n.image) ? n.image[0] : n.image || null;
                        const offers = Array.isArray(n.offers) ? n.offers[0] : n.offers;
                        const price = offers?.price || offers?.priceSpecification?.price || null;
                        const currency = offers?.priceCurrency || offers?.priceSpecification?.priceCurrency || null;
                        const sku = n.sku || null;
                        const desc = n.description || null;
                        jsonLdProducts.push({ name, image, price, currency, sku, description: desc });
                    }
                }
            }
        } catch { }
    });

    // --- NOW remove junk elements ---
    $(JUNK_SELECTORS).remove();

    // --- Find main content area ---
    const mainSelectors = ["main", "article", "[role='main']", "#content", ".content", "#main", ".main-content"];
    let $content: ReturnType<typeof $>;
    let found = false;
    for (const sel of mainSelectors) {
        const $el = $(sel);
        if ($el.length && $el.text().trim().length > 100) {
            $content = $el;
            found = true;
            break;
        }
    }
    if (!found) {
        $content = $("body");
    }

    // --- Extract sections by headings ---
    const sections = extractSections($, $content);

    // --- Build full clean text ---
    const fullText = sections
        .map(s => (s.heading ? `${s.heading}\n${s.content}` : s.content))
        .join("\n\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return {
        title,
        ogTitle,
        ogDescription,
        ogImage,
        sections,
        fullText,
        links: [...new Set(links)],
        images,
        jsonLdProducts,
    };
}

// ─── Section extraction (preserves heading structure) ────────────────

function extractSections($: ReturnType<typeof loadHTML>, $root: any): Section[] {
    const sections: Section[] = [];
    let currentHeading = "";
    let currentLevel = 0;
    let currentParts: string[] = [];

    function flush() {
        const content = currentParts
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        if (content.length > 20) {
            sections.push({
                heading: currentHeading,
                level: currentLevel,
                content,
            });
        }
        currentParts = [];
    }

    // Walk through direct children and extract text with heading awareness
    $root.find("*").each((_: any, el: any) => {
        const tag = (el.tagName || el.name || "").toLowerCase();
        const $el = $(el);

        // Skip nested containers — we only want leaf text
        if (["div", "section", "span", "ul", "ol", "table", "tbody", "thead", "tr", "dl"].includes(tag)) {
            return; // cheerio will still visit children
        }

        // Heading tags — start a new section
        if (/^h[1-6]$/.test(tag)) {
            flush();
            const level = parseInt(tag[1]);
            currentHeading = $el.text().replace(/\s+/g, " ").trim();
            currentLevel = level;
            return;
        }

        // Content tags — collect text
        if (["p", "li", "td", "th", "dt", "dd", "blockquote", "figcaption", "pre", "code"].includes(tag)) {
            const text = $el.text().replace(/\s+/g, " ").trim();
            if (text.length > 5) {
                currentParts.push(text);
            }
        }
    });

    flush();

    // If no sections found (no headings in HTML), create one section from all text
    if (sections.length === 0) {
        const allText = $root.text().replace(/\s+/g, " ").trim();
        if (allText.length > 20) {
            sections.push({ heading: "", level: 0, content: allText });
        }
    }

    return sections;
}

// ─── Smart Chunking ─────────────────────────────────────────────────

export interface ChunkOptions {
    minWords?: number;
    maxWords?: number;
    maxChars?: number;
    overlapSentences?: number;
}

/**
 * Smart chunking: splits by heading sections, adds context prefixes,
 * respects word limits, and adds overlap between chunks.
 */
export function smartChunk(
    pageTitle: string,
    sections: Section[],
    opts: ChunkOptions = {}
): KnowledgeChunk[] {
    const {
        minWords = 100,
        maxWords = 400,
        maxChars = 4000,
        overlapSentences = 2,
    } = opts;

    const chunks: KnowledgeChunk[] = [];

    for (const section of sections) {
        const prefix = buildPrefix(pageTitle, section.heading);
        const words = section.content.split(/\s+/).filter(Boolean);

        if (words.length === 0) continue;

        // If section fits in one chunk, add it directly
        if (words.length <= maxWords) {
            const content = `${prefix}\n${section.content}`.trim();
            if (content.length <= maxChars && words.length >= 10) {
                chunks.push({ content, wordCount: words.length });
            }
            continue;
        }

        // Split large sections into chunks with overlap
        const sentences = splitSentences(section.content);
        let buf: string[] = [];
        let bufWordCount = 0;

        for (let i = 0; i < sentences.length; i++) {
            const sentWords = sentences[i].split(/\s+/).filter(Boolean).length;
            buf.push(sentences[i]);
            bufWordCount += sentWords;

            if (bufWordCount >= maxWords || i === sentences.length - 1) {
                // Create chunk
                let chunkText = buf.join(" ").trim();
                if (chunkText.length > maxChars) chunkText = chunkText.slice(0, maxChars);
                const fullChunk = `${prefix}\n${chunkText}`.trim();

                if (bufWordCount >= Math.min(minWords, 30)) {
                    chunks.push({ content: fullChunk, wordCount: bufWordCount });
                }

                // Keep last N sentences as overlap for next chunk
                const overlapStart = Math.max(0, buf.length - overlapSentences);
                const overlap = buf.slice(overlapStart);
                buf = [...overlap];
                bufWordCount = overlap.join(" ").split(/\s+/).filter(Boolean).length;
            }
        }
    }

    return chunks;
}

function buildPrefix(pageTitle: string, sectionHeading: string): string {
    const parts: string[] = [];
    if (pageTitle) parts.push(pageTitle);
    if (sectionHeading && sectionHeading !== pageTitle) parts.push(sectionHeading);
    if (parts.length === 0) return "";
    return `[${parts.join(" — ")}]`;
}

function splitSentences(text: string): string[] {
    // Split by sentence-ending punctuation, keeping the delimiter
    const raw = text.split(/(?<=[.!?])\s+/);
    return raw.filter(s => s.trim().length > 0);
}

// ─── 3-Layer Product Extraction ─────────────────────────────────────

/**
 * Master product extractor. Tries 3 methods in order:
 * 1. Schema.org JSON-LD  → most accurate, zero hallucination
 * 2. Open Graph product tags → fallback for social-optimized sites
 * 3. HTML pattern matching → fallback for any e-commerce page
 */
export function extractProducts(html: string, pageUrl: string, baseUrl: string): ExtractedProduct[] {
    const $ = loadHTML(html);

    // ── Layer 1: Schema.org JSON-LD ──────────────────────────────────
    const jsonLdProducts: ExtractedProduct[] = [];
    $("script[type='application/ld+json']").each((_: any, el: any) => {
        try {
            const raw = $(el).contents().text();
            const json = JSON.parse(raw);
            const items = Array.isArray(json) ? json : [json];
            for (const obj of items) {
                const g = obj?.["@graph"];
                const list = Array.isArray(g) ? g : [obj];
                for (const n of list) {
                    const type = n?.["@type"] || n?.type;
                    const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
                    if (!isProduct) continue;

                    const name = (n.name || n.title || "").trim();
                    if (!name) continue;

                    const imageRaw = Array.isArray(n.image) ? n.image[0] : n.image;
                    const imageUrl = typeof imageRaw === "string" ? imageRaw : imageRaw?.url || null;

                    const offers = Array.isArray(n.offers) ? n.offers[0] : n.offers;
                    const priceRaw = offers?.price ?? offers?.priceSpecification?.price ?? null;
                    const price = priceRaw !== null ? parseFloat(String(priceRaw)) : null;
                    const currency = offers?.priceCurrency || offers?.priceSpecification?.priceCurrency || "USD";
                    const inStock = offers?.availability
                        ? offers.availability.toLowerCase().includes("instock")
                        : true;

                    const rating = n.aggregateRating?.ratingValue
                        ? parseFloat(String(n.aggregateRating.ratingValue))
                        : null;
                    const reviewCount = n.aggregateRating?.reviewCount
                        ? parseInt(String(n.aggregateRating.reviewCount), 10)
                        : 0;

                    const brand = typeof n.brand === "string"
                        ? n.brand
                        : n.brand?.name || null;

                    const attrs: Record<string, string> = {};
                    if (n.color) attrs.color = String(n.color);
                    if (n.size) attrs.size = String(n.size);
                    if (n.material) attrs.material = String(n.material);

                    jsonLdProducts.push({
                        name,
                        description: n.description || null,
                        price: isNaN(price!) ? null : price,
                        currency,
                        image_url: imageUrl ? new URL(imageUrl, baseUrl).toString() : null,
                        brand,
                        category: n.category || null,
                        sku: n.sku || null,
                        rating,
                        review_count: reviewCount,
                        stock_status: inStock ? "in_stock" : "out_of_stock",
                        attributes: Object.keys(attrs).length ? attrs : undefined,
                        url: pageUrl,
                        source: "json-ld",
                    });
                }
            }
        } catch { }
    });

    if (jsonLdProducts.length > 0) return jsonLdProducts;

    // ── Layer 2: Open Graph product meta tags ────────────────────────
    const ogType = $("meta[property='og:type']").attr("content") || "";
    if (ogType.toLowerCase() === "product") {
        const ogName = $("meta[property='og:title']").attr("content") ||
            $("meta[name='twitter:title']").attr("content") ||
            $("title").text().trim();

        if (ogName) {
            const priceStr = $("meta[property='product:price:amount']").attr("content") ||
                $("meta[property='og:price:amount']").attr("content") || null;
            const price = priceStr ? parseFloat(priceStr) : null;
            const currency = $("meta[property='product:price:currency']").attr("content") ||
                $("meta[property='og:price:currency']").attr("content") || "USD";
            const imageUrl = $("meta[property='og:image']").attr("content") ||
                $("meta[name='twitter:image']").attr("content") || null;
            const description = $("meta[property='og:description']").attr("content") ||
                $("meta[name='description']").attr("content") || null;
            const brand = $("meta[property='product:brand']").attr("content") || null;
            const availStr = $("meta[property='product:availability']").attr("content") || "in stock";
            const inStock = availStr.toLowerCase().includes("in stock") || availStr.toLowerCase().includes("instock");

            return [{
                name: ogName.trim(),
                description,
                price: price !== null && !isNaN(price) ? price : null,
                currency,
                image_url: imageUrl || null,
                brand,
                stock_status: inStock ? "in_stock" : "out_of_stock",
                url: pageUrl,
                source: "opengraph",
            }];
        }
    }

    // ── Layer 3: HTML pattern matching ───────────────────────────────
    // Only try if the page looks like a product page (has a price-like element)
    const priceSelectors = [
        "[itemprop='price']", "[itemprop='offers'] [content]",
        ".price", ".product-price", ".price-box",
        "[class*='price']", "[data-price]",
        "span.amount", ".woocommerce-Price-amount",
    ];
    const nameSelectors = [
        "h1[itemprop='name']", "[itemprop='name']",
        ".product-title h1", ".product-name h1",
        ".product-single__title", "#productTitle",
        "h1.entry-title", "h1",
    ];
    const imageSelectors = [
        "[itemprop='image']", ".product-image img",
        ".product-single__photo img", "#main-image",
        ".woocommerce-product-gallery img",
        "[class*='product'] img",
    ];
    const descSelectors = [
        "[itemprop='description']", ".product-description",
        ".product-single__description", ".woocommerce-product-details__short-description",
        "#product-description", ".description",
    ];
    const brandSelectors = [
        "[itemprop='brand']", ".brand", "[class*='brand']",
        ".product-brand",
    ];

    const getText = (sels: string[]) => {
        for (const s of sels) {
            const t = $(s).first().attr("content") || $(s).first().text().trim();
            if (t) return t;
        }
        return null;
    };
    const getAttr = (sels: string[], attr: string) => {
        for (const s of sels) {
            const v = $(s).first().attr(attr);
            if (v) return v;
        }
        return null;
    };

    const name = getText(nameSelectors);
    const priceText = getText(priceSelectors);
    if (!name || !priceText) return []; // Not a product page

    const priceMatch = priceText.match(/[\d.,]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(",", "")) : null;

    const imgSrc = getAttr(imageSelectors, "src") || getAttr(imageSelectors, "data-src");
    const description = getText(descSelectors);
    const brand = getText(brandSelectors);

    const stockEl = $("[itemprop='availability']").first().attr("content") ||
        $(".availability, [class*='stock']").first().text().toLowerCase();
    const inStock = !stockEl || stockEl.includes("instock") || stockEl.includes("in stock") || stockEl.includes("in-stock");

    return [{
        name: name.trim(),
        description,
        price,
        image_url: imgSrc ? new URL(imgSrc, baseUrl).toString() : null,
        brand,
        stock_status: inStock ? "in_stock" : "out_of_stock",
        url: pageUrl,
        source: "html-pattern",
    }];
}
