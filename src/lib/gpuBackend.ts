/**
 * GPU Backend Client Library
 * ===========================
 * Drop-in replacement for Supabase SDK calls.
 * All methods talk to the GPU backend FastAPI server over HTTP.
 *
 * Usage:
 *   import { gpu } from "@/lib/gpuBackend";
 *   const bots = await gpu.chatbots.list();
 */

const GPU_URL =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GPU_BACKEND_URL) ||
    (typeof process !== "undefined" && process.env.GPU_BACKEND_URL) ||
    "http://localhost:8000";

const API_BASE = `${GPU_URL}/api`;

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function gpuFetch<T = any>(
    path: string,
    opts: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(opts.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, {
        ...opts,
        headers,
        cache: "no-store" as RequestCache,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || body?.error || `GPU Backend error: ${res.status}`);
    }

    // Handle empty responses (204, etc.)
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

function qs(params: Record<string, any>): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
            sp.set(k, String(v));
        }
    }
    const s = sp.toString();
    return s ? `?${s}` : "";
}

// ---------------------------------------------------------------------------
// Types (mirrors src/data/types.ts)
// ---------------------------------------------------------------------------

export type ChatbotRecord = Record<string, any>;
export type ConversationRecord = { id: string; title: string; updated_at: string; bot_id?: string };
export type MessageRecord = { id: string; conversation_id: string; role: string; content: string; created_at: string };
export type MemoryRow = { id: string; role: string; message: string; similarity?: number; created_at?: string };
export type KnowledgeChunk = Record<string, any>;
export type VectorSearchResult = { id: string; content: string; similarity: number; source_title?: string; source_id?: string; type?: string };

// ---------------------------------------------------------------------------
// Chatbot methods
// ---------------------------------------------------------------------------

const chatbots = {
    async list(opts?: { ownerId?: string; includeDeleted?: boolean }): Promise<ChatbotRecord[]> {
        return gpuFetch<ChatbotRecord[]>(`/chatbots${qs({
            owner_id: opts?.ownerId,
            include_deleted: opts?.includeDeleted,
        })}`);
    },

    async getById(id: string): Promise<ChatbotRecord | null> {
        try {
            return await gpuFetch<ChatbotRecord>(`/chatbots/${id}`);
        } catch { return null; }
    },

    async getBySlug(slug: string): Promise<ChatbotRecord | null> {
        try {
            return await gpuFetch<ChatbotRecord>(`/chatbots/slug/${encodeURIComponent(slug)}`);
        } catch { return null; }
    },

    async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
        const res = await gpuFetch<{ available: boolean }>(`/chatbots/check-slug${qs({ slug, exclude_id: excludeId })}`);
        return res.available;
    },

    async create(payload: Record<string, any>): Promise<ChatbotRecord> {
        return gpuFetch<ChatbotRecord>("/chatbots", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async update(id: string, patch: Record<string, any>): Promise<ChatbotRecord> {
        return gpuFetch<ChatbotRecord>(`/chatbots/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        });
    },

    async softDelete(id: string): Promise<void> {
        await gpuFetch(`/chatbots/${id}`, { method: "DELETE" });
    },

    async hardDelete(id: string): Promise<void> {
        await gpuFetch(`/chatbots/${id}/hard`, { method: "DELETE" });
    },
};

// ---------------------------------------------------------------------------
// Conversation methods
// ---------------------------------------------------------------------------

const conversations = {
    async listByBot(botId: string, opts?: { page?: number; pageSize?: number; q?: string }): Promise<ConversationRecord[]> {
        const res = await gpuFetch<{ conversations: ConversationRecord[] }>(`/conversations${qs({
            botId,
            page: opts?.page,
            pageSize: opts?.pageSize,
            q: opts?.q,
        })}`);
        return res.conversations;
    },

    async listAll(opts?: { page?: number; pageSize?: number; q?: string; botId?: string }): Promise<ConversationRecord[]> {
        const res = await gpuFetch<{ conversations: ConversationRecord[] }>(`/conversations${qs({
            botId: opts?.botId,
            page: opts?.page,
            pageSize: opts?.pageSize,
            q: opts?.q,
        })}`);
        return res.conversations;
    },

    async getById(id: string): Promise<ConversationRecord> {
        return gpuFetch<ConversationRecord>(`/conversations/${id}`);
    },

    async create(botIdOrPayload: string | { bot_id: string; title?: string }, title?: string): Promise<ConversationRecord> {
        let botId: string;
        let t: string;
        if (typeof botIdOrPayload === "object") {
            botId = botIdOrPayload.bot_id;
            t = botIdOrPayload.title ?? "New Chat";
        } else {
            botId = botIdOrPayload;
            t = title ?? "New Chat";
        }
        const res = await gpuFetch<{ conversation: ConversationRecord }>("/conversations/json", {
            method: "POST",
            body: JSON.stringify({ botId, title: t }),
        });
        return res.conversation;
    },

    async rename(cid: string, title: string): Promise<ConversationRecord> {
        return gpuFetch<ConversationRecord>(`/conversations/${cid}`, {
            method: "PATCH",
            body: JSON.stringify({ title }),
        });
    },

    async update(cid: string, patch: Record<string, any>): Promise<ConversationRecord> {
        return gpuFetch<ConversationRecord>(`/conversations/${cid}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        });
    },

    async delete(cid: string): Promise<void> {
        await gpuFetch(`/conversations/${cid}`, { method: "DELETE" });
    },

    async exportAsJson(cid: string): Promise<Array<{ role: string; content: string; created_at: string }>> {
        return gpuFetch(`/conversations/${cid}/export`);
    },
};

// ---------------------------------------------------------------------------
// Message methods
// ---------------------------------------------------------------------------

const messages = {
    async list(conversationId: string): Promise<MessageRecord[]> {
        const res = await gpuFetch<{ messages: MessageRecord[] }>(`/messages${qs({ cid: conversationId })}`);
        return res.messages;
    },

    async create(conversationIdOrPayload: string | { conversation_id: string; role: string; content: string }, role?: string, content?: string): Promise<MessageRecord> {
        let cid: string;
        let r: string;
        let c: string;
        if (typeof conversationIdOrPayload === "object") {
            cid = conversationIdOrPayload.conversation_id;
            r = conversationIdOrPayload.role;
            c = conversationIdOrPayload.content;
        } else {
            cid = conversationIdOrPayload;
            r = role!;
            c = content!;
        }
        return gpuFetch<MessageRecord>("/messages", {
            method: "POST",
            body: JSON.stringify({ conversation_id: cid, role: r, content: c }),
        });
    },

    async createBatch(conversationId: string, msgs: Array<{ role: string; content: string }>): Promise<MessageRecord[]> {
        const res = await gpuFetch<{ messages: MessageRecord[] }>("/messages/batch", {
            method: "POST",
            body: JSON.stringify({ conversation_id: conversationId, messages: msgs }),
        });
        return res.messages;
    },

    async delete(messageId: string): Promise<void> {
        await gpuFetch(`/messages/${messageId}`, { method: "DELETE" });
    },
};

// ---------------------------------------------------------------------------
// Knowledge methods
// ---------------------------------------------------------------------------

const knowledge = {
    async list(chatbotId: string, opts?: { type?: string; page?: number; pageSize?: number }): Promise<{ chunks: KnowledgeChunk[]; total: number }> {
        return gpuFetch(`/knowledge${qs({
            chatbotId,
            type: opts?.type,
            page: opts?.page,
            pageSize: opts?.pageSize,
        })}`);
    },

    async create(payload: { chatbot_id: string; type: string; content: string; source_id?: string; source_title?: string; token_count?: number }): Promise<KnowledgeChunk> {
        return gpuFetch<KnowledgeChunk>("/knowledge", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    async createBatch(chatbotId: string, chunks: Array<{ content: string; type?: string; source_id?: string; source_title?: string; token_count?: number }>): Promise<{ chunks: KnowledgeChunk[]; count: number }> {
        return gpuFetch("/knowledge/batch", {
            method: "POST",
            body: JSON.stringify({ chatbot_id: chatbotId, chunks }),
        });
    },

    async search(chatbotId: string, query: string, topK = 5, threshold?: number): Promise<VectorSearchResult[]> {
        const res = await gpuFetch<{ results: VectorSearchResult[] }>("/knowledge/search", {
            method: "POST",
            body: JSON.stringify({ chatbot_id: chatbotId, query, top_k: topK, threshold }),
        });
        return res.results;
    },

    async delete(chunkId: string): Promise<void> {
        await gpuFetch(`/knowledge/${chunkId}`, { method: "DELETE" });
    },

    async deleteByChatbot(chatbotId: string): Promise<{ deleted: number }> {
        return gpuFetch(`/knowledge/by-chatbot/${chatbotId}`, { method: "DELETE" });
    },

    async deleteBySource(chatbotId: string, sourceId: string): Promise<{ deleted: number }> {
        return gpuFetch(`/knowledge/by-source/${chatbotId}/${encodeURIComponent(sourceId)}`, { method: "DELETE" });
    },
};

// ---------------------------------------------------------------------------
// Memory methods
// ---------------------------------------------------------------------------

const memory = {
    async save(params: { chatbot_id: string; user_id: string; conversation_id?: string | null; role: string; message: string }): Promise<MemoryRow> {
        return gpuFetch<MemoryRow>("/memory/save", {
            method: "POST",
            body: JSON.stringify({
                chatbot_id: params.chatbot_id,
                user_id: params.user_id,
                conversation_id: params.conversation_id || null,
                role: params.role,
                message: params.message,
            }),
        });
    },

    async saveBatch(entries: Array<{ chatbot_id: string; user_id: string; conversation_id?: string | null; role: string; message: string }>): Promise<{ memories: MemoryRow[]; count: number }> {
        return gpuFetch("/memory/save-batch", {
            method: "POST",
            body: JSON.stringify({ entries }),
        });
    },

    async search(params: { query: string; user_id: string; chatbot_id: string; conversation_id?: string | null; limit?: number }): Promise<MemoryRow[]> {
        const res = await gpuFetch<{ results: MemoryRow[] }>("/memory/search", {
            method: "POST",
            body: JSON.stringify({
                query: params.query,
                user_id: params.user_id,
                chatbot_id: params.chatbot_id,
                conversation_id: params.conversation_id || null,
                limit: params.limit ?? 5,
            }),
        });
        return res.results;
    },

    async list(chatbotId: string, userId: string, opts?: { conversationId?: string; page?: number; pageSize?: number }): Promise<MemoryRow[]> {
        const res = await gpuFetch<{ memories: MemoryRow[] }>(`/memory${qs({
            chatbotId,
            userId,
            conversationId: opts?.conversationId,
            page: opts?.page,
            pageSize: opts?.pageSize,
        })}`);
        return res.memories;
    },

    async delete(memoryId: string): Promise<void> {
        await gpuFetch(`/memory/${memoryId}`, { method: "DELETE" });
    },

    async deleteByConversation(conversationId: string): Promise<{ deleted: number }> {
        return gpuFetch(`/memory/by-conversation/${conversationId}`, { method: "DELETE" });
    },

    async deleteByUser(chatbotId: string, userId: string): Promise<{ deleted: number }> {
        return gpuFetch(`/memory/by-user/${chatbotId}/${userId}`, { method: "DELETE" });
    },
};

// ---------------------------------------------------------------------------
// Embed methods (direct GPU access)
// ---------------------------------------------------------------------------

const embed = {
    async text(text: string): Promise<number[]> {
        const res = await gpuFetch<{ embeddings: number[][]; dimensions: number; model: string }>("/embed", {
            method: "POST",
            body: JSON.stringify({ texts: text }),
        });
        return res.embeddings[0];
    },

    async batch(texts: string[]): Promise<number[][]> {
        const res = await gpuFetch<{ embeddings: number[][]; dimensions: number; model: string }>("/embed", {
            method: "POST",
            body: JSON.stringify({ texts }),
        });
        return res.embeddings;
    },
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const orders = {
    async list(botId?: string, opts?: { status?: string; page?: number; pageSize?: number }): Promise<any[]> {
        const res = await gpuFetch<{ orders: any[] }>(`/orders${qs({ botId, status: opts?.status, page: opts?.page, pageSize: opts?.pageSize })}`);
        return res.orders;
    },
    async listByBot(botId: string, opts?: { status?: string; page?: number; pageSize?: number }): Promise<any[]> {
        return this.list(botId, opts);
    },
    async getById(id: string): Promise<any> { return gpuFetch(`/orders/${id}`); },
    async create(payload: any): Promise<any> { return gpuFetch("/orders", { method: "POST", body: JSON.stringify(payload) }); },
    async update(id: string, patch: any): Promise<any> { return gpuFetch(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); },
    async delete(id: string): Promise<void> { await gpuFetch(`/orders/${id}`, { method: "DELETE" }); },
};

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

const reservations = {
    async list(botId?: string, opts?: { status?: string; page?: number; pageSize?: number }): Promise<any[]> {
        const res = await gpuFetch<{ reservations: any[] }>(`/reservations${qs({ botId, status: opts?.status, page: opts?.page, pageSize: opts?.pageSize })}`);
        return res.reservations;
    },
    async listByBot(botId: string, opts?: { status?: string; page?: number; pageSize?: number }): Promise<any[]> {
        return this.list(botId, opts);
    },
    async getById(id: string): Promise<any> { return gpuFetch(`/reservations/${id}`); },
    async create(payload: any): Promise<any> { return gpuFetch("/reservations", { method: "POST", body: JSON.stringify(payload) }); },
    async update(id: string, patch: any): Promise<any> { return gpuFetch(`/reservations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); },
    async delete(id: string): Promise<void> { await gpuFetch(`/reservations/${id}`, { method: "DELETE" }); },
};

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

const leads = {
    async list(chatbotId: string, opts?: { status?: string; page?: number; pageSize?: number }): Promise<any[]> {
        const res = await gpuFetch<{ leads: any[] }>(`/leads${qs({ chatbotId, status: opts?.status, page: opts?.page, pageSize: opts?.pageSize })}`);
        return res.leads;
    },
    async getById(id: string): Promise<any> { return gpuFetch(`/leads/${id}`); },
    async create(payload: any): Promise<any> { return gpuFetch("/leads", { method: "POST", body: JSON.stringify(payload) }); },
    async update(id: string, patch: any): Promise<any> { return gpuFetch(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); },
    async delete(id: string): Promise<void> { await gpuFetch(`/leads/${id}`, { method: "DELETE" }); },
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const products = {
    async list(chatbotId: string, opts?: { category?: string; inStock?: boolean; page?: number; pageSize?: number }): Promise<any[]> {
        const res = await gpuFetch<{ products: any[] }>(`/products${qs({ chatbotId, category: opts?.category, inStock: opts?.inStock, page: opts?.page, pageSize: opts?.pageSize })}`);
        return res.products;
    },
    async search(chatbotId: string, queryOrOpts?: string | { query?: string; min_price?: number; max_price?: number; category?: string; in_stock?: boolean; limit?: number }, opts?: { minPrice?: number; maxPrice?: number; category?: string; inStock?: boolean; limit?: number }): Promise<any[]> {
        let payload: Record<string, any>;
        if (typeof queryOrOpts === "object") {
            // Called as search(chatbotId, { query, min_price, ... })
            payload = { chatbot_id: chatbotId, ...queryOrOpts };
        } else {
            // Called as search(chatbotId, query, opts?)
            payload = { chatbot_id: chatbotId, query: queryOrOpts, ...opts };
        }
        const res = await gpuFetch<{ products: any[] }>("/products/search", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return res.products;
    },
    async getById(id: string): Promise<any> { return gpuFetch(`/products/${id}`); },
    async create(payload: any): Promise<any> { return gpuFetch("/products", { method: "POST", body: JSON.stringify(payload) }); },
    async createBatch(chatbotId: string, products: any[]): Promise<{ products: any[]; count: number }> {
        return gpuFetch("/products/batch", { method: "POST", body: JSON.stringify({ chatbot_id: chatbotId, products }) });
    },
    async update(id: string, patch: any): Promise<any> { return gpuFetch(`/products/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); },
    async delete(id: string): Promise<void> { await gpuFetch(`/products/${id}`, { method: "DELETE" }); },
    async deleteByChatbot(chatbotId: string): Promise<{ deleted: number }> { return gpuFetch(`/products/by-chatbot/${chatbotId}`, { method: "DELETE" }); },
};

// ---------------------------------------------------------------------------
// Instagram
// ---------------------------------------------------------------------------

const instagram = {
    connections: {
        async list(chatbotId?: string): Promise<any[]> {
            const res = await gpuFetch<{ connections: any[] }>(`/instagram/connections${qs({ chatbotId })}`);
            return res.connections;
        },
        async getById(id: string): Promise<any> { return gpuFetch(`/instagram/connections/${id}`); },
        async create(payload: any): Promise<any> { return gpuFetch("/instagram/connections", { method: "POST", body: JSON.stringify(payload) }); },
        async update(id: string, patch: any): Promise<any> { return gpuFetch(`/instagram/connections/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); },
        async delete(id: string): Promise<void> { await gpuFetch(`/instagram/connections/${id}`, { method: "DELETE" }); },
    },
    conversations: {
        async list(connectionId?: string): Promise<any[]> {
            const res = await gpuFetch<{ conversations: any[] }>(`/instagram/conversations${qs({ connectionId })}`);
            return res.conversations;
        },
        async create(payload: any): Promise<any> { return gpuFetch("/instagram/conversations", { method: "POST", body: JSON.stringify(payload) }); },
        async update(id: string, patch: any): Promise<any> { return gpuFetch(`/instagram/conversations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); },
    },
    messages: {
        async list(conversationId: string, opts?: { page?: number; pageSize?: number }): Promise<any[]> {
            const res = await gpuFetch<{ messages: any[] }>(`/instagram/messages${qs({ conversationId, page: opts?.page, pageSize: opts?.pageSize })}`);
            return res.messages;
        },
        async create(payload: any): Promise<any> { return gpuFetch("/instagram/messages", { method: "POST", body: JSON.stringify(payload) }); },
    },
    // Shorthand methods for route compatibility
    async getConnection(botId: string): Promise<any> {
        const list = await instagram.connections.list(botId);
        return list?.[0] || null;
    },
    async connect(payload: any): Promise<any> {
        return instagram.connections.create(payload);
    },
    async disconnect(id: string): Promise<void> {
        await instagram.connections.delete(id);
    },
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const pages = {
    async list(chatbotId?: string, opts?: { page?: number; pageSize?: number }): Promise<any[]> {
        const res = await gpuFetch<{ pages: any[] }>(`/pages${qs({ chatbotId, page: opts?.page, pageSize: opts?.pageSize })}`);
        return res.pages;
    },
    async getById(id: string): Promise<any> { return gpuFetch(`/pages/${id}`); },
    async create(payload: any): Promise<any> { return gpuFetch("/pages", { method: "POST", body: JSON.stringify(payload) }); },
    async fulltextSearch(chatbotId: string, query: string, limit = 10): Promise<any[]> {
        const res = await gpuFetch<{ results: any[] }>("/pages/fulltext-search", {
            method: "POST",
            body: JSON.stringify({ chatbot_id: chatbotId, query, limit }),
        });
        return res.results;
    },
    async search(chatbotId: string, query: string, limit = 10): Promise<any[]> {
        return pages.fulltextSearch(chatbotId, query, limit);
    },
    async delete(id: string): Promise<void> { await gpuFetch(`/pages/${id}`, { method: "DELETE" }); },
};

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

const backup = {
    async create(): Promise<Blob> {
        const url = `${API_BASE}/backup`;
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(`Backup failed: ${res.status}`);
        return res.blob();
    },

    async restore(file: File): Promise<{ ok: boolean; restored: Record<string, number>; total_rows: number }> {
        const formData = new FormData();
        formData.append("file", file);
        const url = `${API_BASE}/restore`;
        const res = await fetch(url, { method: "POST", body: formData });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.detail || `Restore failed: ${res.status}`);
        }
        return res.json();
    },

    async status(): Promise<{ tables: Record<string, number>; total_rows: number; faiss: Record<string, number> }> {
        return gpuFetch("/backup/status");
    },
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

const health = {
    async check(): Promise<{ status: string; database: string; embedder: string; vector_store: Record<string, number> }> {
        return gpuFetch("/health");
    },
};

// ---------------------------------------------------------------------------
// Lead Capture Attempts
// ---------------------------------------------------------------------------

const leadCaptureAttempts = {
    async list(conversationId: string): Promise<any[]> {
        const res = await gpuFetch<{ attempts: any[] }>(`/lead-capture-attempts${qs({ conversationId })}`);
        return res.attempts;
    },
    async create(payload: { conversation_id: string; trigger_type?: string }): Promise<any> {
        return gpuFetch("/lead-capture-attempts", { method: "POST", body: JSON.stringify(payload) });
    },
};

// ---------------------------------------------------------------------------
// Properties (real-estate search)
// ---------------------------------------------------------------------------

const assets = {
    async upload(file: Blob | Buffer, opts: { pageId: string; sourceUrl?: string; chatbotId?: string; contentType?: string }): Promise<any> {
        const formData = new FormData();
        const blob = file instanceof Blob ? file : new Blob([new Uint8Array(file)], { type: opts.contentType || "application/octet-stream" });
        formData.append("file", blob, "image.jpg");
        formData.append("page_id", opts.pageId);
        formData.append("source_url", opts.sourceUrl || "");
        formData.append("chatbot_id", opts.chatbotId || "");
        const url = `${API_BASE}/assets/upload`;
        const res = await fetch(url, { method: "POST", body: formData, cache: "no-store" as RequestCache });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b?.detail || `Upload error: ${res.status}`); }
        return res.json();
    },
    /**
     * Download an image from an external URL on the GPU server and return
     * a stable serve URL ({GPU_URL}/api/assets/file/{key}).
     * Deduplicates by SHA-256 — same image is never stored twice.
     */
    async uploadFromUrl(imageUrl: string, chatbotId: string): Promise<string> {
        const res = await gpuFetch<{ serve_url: string }>("/assets/from-url", {
            method: "POST",
            body: JSON.stringify({ url: imageUrl, chatbot_id: chatbotId }),
        });
        // Return full absolute URL so the browser can load it directly
        return `${GPU_URL}${res.serve_url}`;
    },
    async list(opts?: { pageId?: string; chatbotId?: string }): Promise<any[]> {
        const res = await gpuFetch<{ assets: any[] }>(`/assets${qs({ page_id: opts?.pageId, chatbot_id: opts?.chatbotId })}`);
        return res.assets;
    },
    async delete(id: string): Promise<void> { await gpuFetch(`/assets/${id}`, { method: "DELETE" }); },
    async deleteByPage(pageId: string): Promise<{ deleted: number }> { return gpuFetch(`/assets/by-page/${pageId}`, { method: "DELETE" }); },
    serveUrl(fileKey: string): string { return `${GPU_URL}/api/assets/file/${fileKey}`; },
};

const intent = {
    async classify(message: string, chatbotId?: string): Promise<{
        is_product_query: boolean;
        search_query: string;
        max_price: number | null;
        min_rating: number | null;
        category: string | null;
        wants_images: boolean;
    }> {
        try {
            return await gpuFetch("/intent/classify", {
                method: "POST",
                body: JSON.stringify({ message, chatbot_id: chatbotId }),
            });
        } catch {
            // Fallback: basic regex if GPU endpoint fails
            const q = message.toLowerCase();
            const priceMatch = q.match(/(?:under|below|less\s+than)\s*[£$₹]?\s*(\d+)/);
            return {
                is_product_query: /show|find|book|product|price|buy|recommend|image|photo|stock|available/i.test(q),
                search_query: message,
                max_price: priceMatch ? parseInt(priceMatch[1]) : null,
                min_rating: null,
                category: null,
                wants_images: /photo|image|picture|show.*me/i.test(q),
            };
        }
    },
};

async function chatPrepare(chatbotId: string, query: string): Promise<{
    type: "product" | "knowledge" | "general" | "both";
    route: {
        type: string;
        product_query: string | null;
        knowledge_query: string | null;
        max_price: number | null;
        category: string | null;
        wants_images: boolean;
    };
    knowledge_chunks: Array<{ id: string; content: string; source_title: string | null; similarity: number }>;
    knowledge_count: number;
    pages: Array<{ url: string; title: string; snippet: string }>;
    page_count: number;
    products: any[];
    product_count: number;
    timing: Record<string, number>;
}> {
    return await gpuFetch("/chat/prepare", {
        method: "POST",
        body: JSON.stringify({ chatbot_id: chatbotId, query }),
    });
}

const properties = {

    async search(chatbotId: string, opts?: Record<string, any>): Promise<any[]> {
        const res = await gpuFetch<{ properties: any[] }>("/properties/search", {
            method: "POST",
            body: JSON.stringify({ chatbot_id: chatbotId, ...opts }),
        });
        return res.properties;
    },
};

// ---------------------------------------------------------------------------
// Unified export
// ---------------------------------------------------------------------------

export const gpu = {
    chatbots,
    conversations,
    messages,
    knowledge,
    memory,
    embed,
    orders,
    reservations,
    leads,
    products,
    instagram,
    pages,
    backup,
    health,
    leadCaptureAttempts,
    assets,
    properties,
    intent,
    chatPrepare,
};

export default gpu;
