/**
 * Smart E-commerce Product Extractor
 * Extracts product data from websites using multiple methods:
 * 1. JSON-LD structured data (best quality)
 * 2. Open Graph & meta tags
 * 3. Microdata (itemprop attributes)
 * 4. Common CSS patterns (Shopify, WooCommerce, etc.)
 * 5. LLM extraction (fallback)
 */

import { load as loadHTML, type CheerioAPI } from "cheerio";
import OpenAI from "openai";

export interface ExtractedProduct {
    name: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    currency?: string;
    category?: string;
    brand?: string;
    sku?: string;
    imageUrl?: string;
    imageUrls?: string[];
    stockStatus?: "in_stock" | "out_of_stock" | "limited";
    rating?: number;
    reviewCount?: number;
    variants?: Array<{ name: string; value: string; price?: number }>;
    url: string;
    sourcePlatform?: string;
    rawJson?: any;
}

interface ExtractionResult {
    isEcommerce: boolean;
    products: ExtractedProduct[];
    platform?: string;
}

/**
 * Detect if page is e-commerce and extract products
 */
export function extractProducts(html: string, pageUrl: string): ExtractionResult {
    const $ = loadHTML(html);
    const products: ExtractedProduct[] = [];
    let platform: string | undefined;

    // 1. Try JSON-LD first (most reliable)
    const jsonLdProducts = extractFromJsonLd($, pageUrl);
    if (jsonLdProducts.length > 0) {
        products.push(...jsonLdProducts);
    }

    // 2. Try Open Graph product meta tags
    const ogProduct = extractFromOpenGraph($, pageUrl);
    if (ogProduct && !products.some(p => p.name === ogProduct.name)) {
        products.push(ogProduct);
    }

    // 3. Try Microdata (itemprop)
    const microdataProducts = extractFromMicrodata($, pageUrl);
    for (const p of microdataProducts) {
        if (!products.some(existing => existing.name === p.name)) {
            products.push(p);
        }
    }

    // 4. Detect platform and use specific extractors
    platform = detectPlatform($, html);
    if (platform && products.length === 0) {
        const platformProducts = extractFromPlatform($, pageUrl, platform);
        products.push(...platformProducts);
    }

    // 5. Try listing page extraction (category pages with multiple product cards)
    if (products.length === 0) {
        const listingProducts = extractFromListingPage($, pageUrl);
        products.push(...listingProducts);
    }

    // Determine if this is an e-commerce page
    const isEcommerce = products.length > 0 || hasEcommerceSignals($, html);

    return { isEcommerce, products, platform };
}

/**
 * Extract products from listing/category pages (product cards/grids)
 * Handles: books.toscrape.com, generic Shopify/WooCommerce listing pages
 */
function extractFromListingPage($: ReturnType<typeof loadHTML>, pageUrl: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];

    // Common product card selectors (in priority order)
    const cardSelectors = [
        "article.product_pod",           // books.toscrape.com
        "li.product",                    // WooCommerce
        ".product-item",                 // Generic
        ".product-card",                 // Generic
        "[class*='product-item']",       // Generic
        "[class*='product_item']",       // Generic
        ".item.product",                 // Magento
        "div.product",                   // Generic
    ];

    for (const cardSel of cardSelectors) {
        const cards = $(cardSel);
        if (cards.length < 2) continue; // Need at least 2 to be a listing page

        cards.each((_: any, el: any) => {
            const $card = $(el);

            // Name — try various selectors
            const name = $card.find("h3 a").attr("title") ||
                $card.find("h2 a").attr("title") ||
                $card.find("h3 a").text().trim() ||
                $card.find("h2 a").text().trim() ||
                $card.find("[itemprop='name']").text().trim() ||
                $card.find(".product-title").text().trim() ||
                $card.find(".product-name").text().trim();

            if (!name) return;

            // Price — extract number from price text
            const priceText = $card.find(".price_color").text().trim() ||
                $card.find(".price").first().text().trim() ||
                $card.find("[class*='price']").first().text().trim() ||
                $card.find("[itemprop='price']").attr("content") || "";
            const priceMatch = priceText.match(/[\d.,]+/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(",", "")) : undefined;

            // Currency — detect from symbol
            const currency = priceText.includes("£") ? "GBP" :
                priceText.includes("€") ? "EUR" :
                    priceText.includes("₹") ? "INR" : "USD";

            // Image
            const imgSrc = $card.find("img").first().attr("src") ||
                $card.find("img").first().attr("data-src");
            let imageUrl: string | undefined;
            if (imgSrc) {
                try { imageUrl = new URL(imgSrc, pageUrl).toString(); } catch { }
            }

            // Stock status
            const stockText = ($card.find(".availability, .instock, [class*='stock']").first().text() || "").toLowerCase();
            const inStock = !stockText || stockText.includes("in stock") || stockText.includes("available");

            // Rating — from star-rating class (e.g. "star-rating Three")
            let rating: number | undefined;
            const starClass = $card.find("[class*='star-rating']").attr("class") || "";
            const ratingMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
            const starMatch = starClass.toLowerCase().match(/\b(one|two|three|four|five)\b/);
            if (starMatch) rating = ratingMap[starMatch[1]];

            // Product page URL
            const linkHref = $card.find("a").first().attr("href");
            let productUrl = pageUrl;
            if (linkHref) {
                try { productUrl = new URL(linkHref, pageUrl).toString(); } catch { }
            }

            products.push({
                name: name.trim(),
                price,
                currency,
                imageUrl,
                stockStatus: inStock ? "in_stock" : "out_of_stock",
                rating,
                url: productUrl,
                sourcePlatform: "listing-page",
            });
        });

        if (products.length > 0) break; // Found products, stop trying other selectors
    }

    return products;
}

/**
 * Extract products from JSON-LD structured data
 */
function extractFromJsonLd($: CheerioAPI, pageUrl: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];

    $("script[type='application/ld+json']").each((_, el) => {
        try {
            const raw = $(el).contents().text();
            const json = JSON.parse(raw);
            const items = Array.isArray(json) ? json : [json];

            for (const obj of items) {
                // Handle @graph structure
                const graph = obj?.["@graph"];
                const nodes = Array.isArray(graph) ? graph : [obj];

                for (const node of nodes) {
                    const type = node?.["@type"];
                    const isProduct =
                        type === "Product" ||
                        (Array.isArray(type) && type.includes("Product"));

                    if (isProduct) {
                        const product = parseJsonLdProduct(node, pageUrl);
                        if (product) products.push(product);
                    }
                }
            }
        } catch {
            // Invalid JSON, skip
        }
    });

    return products;
}

function parseJsonLdProduct(node: any, pageUrl: string): ExtractedProduct | null {
    const name = node.name || node.title;
    if (!name) return null;

    const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
    const price = parseFloat(offers?.price || offers?.priceSpecification?.price || "0");
    const currency = offers?.priceCurrency || offers?.priceSpecification?.priceCurrency || "USD";

    let imageUrl = node.image;
    if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];
    if (typeof imageUrl === "object") imageUrl = imageUrl?.url || imageUrl?.contentUrl;

    const availability = offers?.availability || "";
    let stockStatus: ExtractedProduct["stockStatus"] = "in_stock";
    if (availability.includes("OutOfStock")) stockStatus = "out_of_stock";
    else if (availability.includes("LimitedAvailability")) stockStatus = "limited";

    return {
        name,
        description: node.description || undefined,
        price: price > 0 ? price : undefined,
        currency,
        brand: node.brand?.name || node.brand || undefined,
        sku: node.sku || undefined,
        imageUrl,
        imageUrls: Array.isArray(node.image) ? node.image : undefined,
        stockStatus,
        rating: node.aggregateRating?.ratingValue ? parseFloat(node.aggregateRating.ratingValue) : undefined,
        reviewCount: node.aggregateRating?.reviewCount ? parseInt(node.aggregateRating.reviewCount) : undefined,
        category: node.category || undefined,
        url: node.url || pageUrl,
        rawJson: node,
    };
}

/**
 * Extract from Open Graph meta tags
 */
function extractFromOpenGraph($: CheerioAPI, pageUrl: string): ExtractedProduct | null {
    const ogType = $("meta[property='og:type']").attr("content");
    if (ogType !== "product" && ogType !== "og:product") {
        // Check for product price meta as fallback indicator
        if (!$("meta[property='product:price:amount']").length) {
            return null;
        }
    }

    const name = $("meta[property='og:title']").attr("content");
    if (!name) return null;

    const priceStr = $("meta[property='product:price:amount']").attr("content");
    const price = priceStr ? parseFloat(priceStr) : undefined;
    const currency = $("meta[property='product:price:currency']").attr("content") || "USD";

    return {
        name,
        description: $("meta[property='og:description']").attr("content") || undefined,
        price,
        currency,
        imageUrl: $("meta[property='og:image']").attr("content") || undefined,
        stockStatus: $("meta[property='product:availability']").attr("content")?.includes("in") ? "in_stock" : "out_of_stock",
        url: $("meta[property='og:url']").attr("content") || pageUrl,
    };
}

/**
 * Extract from Microdata (itemprop attributes)
 */
function extractFromMicrodata($: CheerioAPI, pageUrl: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];

    $("[itemtype*='schema.org/Product']").each((_, el) => {
        const $product = $(el);
        const name = $product.find("[itemprop='name']").first().text().trim();
        if (!name) return;

        const priceStr = $product.find("[itemprop='price']").attr("content") ||
            $product.find("[itemprop='price']").text().replace(/[^0-9.]/g, "");
        const price = priceStr ? parseFloat(priceStr) : undefined;

        products.push({
            name,
            description: $product.find("[itemprop='description']").text().trim() || undefined,
            price,
            currency: $product.find("[itemprop='priceCurrency']").attr("content") || "USD",
            imageUrl: $product.find("[itemprop='image']").attr("src") || $product.find("[itemprop='image']").attr("content"),
            sku: $product.find("[itemprop='sku']").attr("content") || $product.find("[itemprop='sku']").text().trim() || undefined,
            brand: $product.find("[itemprop='brand']").text().trim() || undefined,
            url: pageUrl,
        });
    });

    return products;
}

/**
 * Detect e-commerce platform
 */
function detectPlatform($: CheerioAPI, html: string): string | undefined {
    // Shopify
    if (html.includes("Shopify.theme") || html.includes("cdn.shopify.com")) {
        return "shopify";
    }
    // WooCommerce
    if (html.includes("woocommerce") || $(".woocommerce").length > 0) {
        return "woocommerce";
    }
    // Magento
    if (html.includes("Magento") || html.includes("mage/")) {
        return "magento";
    }
    // BigCommerce
    if (html.includes("BigCommerce") || html.includes("bigcommerce.com")) {
        return "bigcommerce";
    }
    // PrestaShop
    if (html.includes("PrestaShop") || html.includes("prestashop")) {
        return "prestashop";
    }
    return undefined;
}

/**
 * Platform-specific extraction
 */
function extractFromPlatform($: CheerioAPI, pageUrl: string, platform: string): ExtractedProduct[] {
    const products: ExtractedProduct[] = [];

    switch (platform) {
        case "shopify":
            // Shopify product page
            const shopifyName = $(".product-single__title, .product__title, h1.title").first().text().trim();
            const shopifyPriceStr = $(".product__price, .price__regular, [data-product-price]").first().text().replace(/[^0-9.]/g, "");
            if (shopifyName) {
                products.push({
                    name: shopifyName,
                    description: $(".product-single__description, .product__description").text().trim() || undefined,
                    price: shopifyPriceStr ? parseFloat(shopifyPriceStr) : undefined,
                    imageUrl: $(".product-single__photo img, .product__media img").first().attr("src"),
                    url: pageUrl,
                    sourcePlatform: "shopify",
                });
            }
            break;

        case "woocommerce":
            // WooCommerce product page
            const wooName = $(".product_title, h1.entry-title").first().text().trim();
            const wooPriceStr = $(".woocommerce-Price-amount, .price ins .amount, .price .amount").first().text().replace(/[^0-9.]/g, "");
            if (wooName) {
                products.push({
                    name: wooName,
                    description: $(".woocommerce-product-details__short-description, .product-short-description").text().trim() || undefined,
                    price: wooPriceStr ? parseFloat(wooPriceStr) : undefined,
                    imageUrl: $(".woocommerce-product-gallery__image img, .wp-post-image").first().attr("src"),
                    url: pageUrl,
                    sourcePlatform: "woocommerce",
                });
            }
            break;
    }

    return products;
}

/**
 * Check for e-commerce signals even if no products extracted
 */
function hasEcommerceSignals($: CheerioAPI, html: string): boolean {
    const signals = [
        html.includes("add-to-cart") || html.includes("add_to_cart"),
        html.includes("shopping-cart") || html.includes("shopping_cart"),
        $("[class*='product']").length > 3,
        $("[class*='price']").length > 0,
        $("button:contains('Add to Cart')").length > 0,
        $("button:contains('Buy Now')").length > 0,
        html.includes("checkout"),
        html.includes("cart"),
    ];
    return signals.filter(Boolean).length >= 3;
}

/**
 * LLM-based extraction as fallback
 */
export async function extractWithLLM(html: string, pageUrl: string): Promise<ExtractedProduct[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return [];

    const openai = new OpenAI({ apiKey });

    // Clean HTML to reduce tokens
    const $ = loadHTML(html);
    $("script, style, nav, footer, header").remove();
    const cleanText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 4000);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a product data extractor. Extract product information from webpage text.
Return JSON array: [{ "name": "", "price": 0, "currency": "USD", "description": "", "category": "", "imageUrl": "" }]
If no products found, return empty array [].`,
                },
                {
                    role: "user",
                    content: `Extract products from this page (${pageUrl}):\n\n${cleanText}`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const content = response.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        const items = parsed.products || parsed.items || (Array.isArray(parsed) ? parsed : []);

        return items.map((item: any) => ({
            name: item.name || "Unknown Product",
            description: item.description,
            price: typeof item.price === "number" ? item.price : parseFloat(item.price) || undefined,
            currency: item.currency || "USD",
            category: item.category,
            imageUrl: item.imageUrl || item.image,
            url: pageUrl,
            sourcePlatform: "llm_extracted",
        }));
    } catch (error) {
        console.error("LLM extraction failed:", error);
        return [];
    }
}

/**
 * Generate embedding for product (for semantic search)
 */
export async function generateProductEmbedding(product: ExtractedProduct): Promise<number[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const openai = new OpenAI({ apiKey });
    const text = `${product.name} ${product.description || ""} ${product.category || ""} ${product.brand || ""}`.trim();

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });
        return response.data[0].embedding;
    } catch {
        return null;
    }
}
