"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
// Unified Markdown + Math rendering component
import { RenderedMessage } from "./RenderedMessage"; // handles markdown + math normalization (converts [ ... ] to LaTeX)
import { ProductDetailModal, type ProductDetail } from "./ProductDetailModal";
import type { PublicChatProps } from "./PublicChat";
import { shouldShowActionButtons } from "@/components/utils";
import { renamePublicConversation, deletePublicConversation } from "@/data/publicConversationMutations";
import { listPublicConversations, listPublicMessages } from "@/data/publicConversations";
import { useVoiceChat } from "@/hooks/useVoiceChat";
// Voice streaming is inline — no overlay needed

type Msg = { role: "user" | "assistant"; content: string };

export default function PersistentChat(props: PublicChatProps & { botId: string }) {
  const {
    slug,
    name,
    directive,
    knowledgeBase,
    avatarUrl,
    brandColor,
    bubbleStyle,
    greeting,
    typingIndicator,
    starterQuestions,
    tagline,
    botId,
    // New optional rules/settings surface (if provided by parent fetch)
    rules,
  } = props as any;
  // Enforce: user cannot send another message until reply returns
  // Default to true (always wait), independent of rules
  const waitForReply: boolean = true;

  // Sidebar state
  const [convs, setConvs] = useState<Array<{ id: string; title: string; updated_at: string }>>([]);
  const [activeCid, setActiveCid] = useState<string | null>(null);
  const activeCidRef = useRef<string | null>(null);
  // Keep ref in sync so WebSocket closures always get the latest value
  useEffect(() => { activeCidRef.current = activeCid; }, [activeCid]);
  const [chatName, setChatName] = useState<string>("New Chat");
  const storageKey = useMemo(() => `public-chat:${slug}:active`, [slug]);
  const sessionsKey = useMemo(() => `public-chat:${slug}:sessions:v1`, [slug]);
  const visitorKey = useMemo(() => `bf_visitor:${slug}`, [slug]);

  // Generate or retrieve a unique visitor ID for this browser + bot
  const visitorId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    let vid = localStorage.getItem(visitorKey);
    if (!vid) {
      vid = crypto?.randomUUID ? crypto.randomUUID() : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(visitorKey, vid);
    }
    return vid;
  }, [visitorKey]);

  // Detect embed mode from URL query param (?embed=1)
  const [isEmbed, setIsEmbed] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsEmbed(params.get('embed') === '1');
    }
  }, []);

  // Messages for currently active conversation
  const [messages, setMessages] = useState<Msg[]>(
    greeting ? [{ role: "assistant", content: greeting }] : []
  );
  // Local cache of conversation -> messages so switching convs is instant
  const [messageCache, setMessageCache] = useState<Record<string, Msg[]>>({});
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Voice Chat with Kokoro TTS
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [partial, setPartial] = useState<string>("");
  const pendingVoiceTextRef = useRef<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Product detail modal
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);

  // ── Inline Voice Streaming State ──
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isVoiceTyping, setIsVoiceTyping] = useState(false);
  const voiceAudioCtxRef = useRef<AudioContext | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceWorkletRef = useRef<AudioWorkletNode | null>(null);
  const voiceWsRef = useRef<WebSocket | null>(null);
  const radius = bubbleStyle === "square" ? "rounded-md" : "rounded-2xl";

  // Light mode toggle (UI only)
  const [light, setLight] = useState(false);
  const bgMain = light ? "bg-white text-black" : "bg-[#0a0a0a] text-white";
  const bgPanel = light ? "bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60" : "bg-[#0a0a0a]/70 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/50";
  const bgChip = light ? "bg-gray-100" : "bg-[#141414]";
  const borderClr = light ? "border-gray-200" : "border-gray-800";
  const borderInput = light ? "border-gray-300" : "border-gray-700";
  const bubbleUserText = light ? "#000000" : "#000000";
  const bubbleBotBg = light ? "transparent" : "transparent";
  const bubbleBotText = light ? "#374151" : "#d1d5db";

  // Sidebar open on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar dropdown menu
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);

  // Load from localStorage (cached sessions) then fetch server conversations
  useEffect(() => {
    (async () => {
      try {
        // Restore cached sessions first for instant UX
        let cachedConvs: Array<{ id: string; title: string; updated_at: string }> = [];
        let cachedMessages: Record<string, Msg[]> = {};
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(sessionsKey);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { convs?: Array<{ id: string; title: string; updated_at: string }>; messages?: Record<string, Msg[]> };
              if (parsed?.convs) { setConvs(parsed.convs); cachedConvs = parsed.convs; }
              if (parsed?.messages) { setMessageCache(parsed.messages); cachedMessages = parsed.messages; }
            } catch { }
          }
        }
        const rows = await listPublicConversations(slug, { pageSize: 50, visitorId });
        // Merge server rows with any locally cached convs (e.g., fallback-created)
        const byId: Record<string, { id: string; title: string; updated_at: string }> = {};
        for (const r of rows as any) byId[r.id] = r;
        for (const c of cachedConvs) if (!byId[c.id]) byId[c.id] = c;
        const merged = Object.values(byId).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        setConvs(merged as any);
        const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (saved && (merged as any).find((r: any) => r.id === saved)) {
          setActiveCid(saved);
        } else if (merged.length) {
          setActiveCid(merged[0].id);
        } else {
          setActiveCid(null);
          setMessages(greeting ? [{ role: 'assistant', content: greeting }] : []);
        }
      } catch (e) {
        console.warn('load convs failed', e);
      }
    })();
  }, [slug, storageKey, sessionsKey, greeting, visitorId]);

  // Persist active conversation id
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeCid) localStorage.setItem(storageKey, activeCid); else localStorage.removeItem(storageKey);
  }, [activeCid, storageKey]);

  // Persist sessions (conversation list + messages cache)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(sessionsKey, JSON.stringify({ convs, messages: messageCache }));
    } catch { }
  }, [convs, messageCache, sessionsKey]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeCid) return;
    (async () => {
      try {
        if (messageCache[activeCid]) {
          setMessages(messageCache[activeCid]); // optimistic
        }
        const ms = await listPublicMessages(slug, activeCid);
        const asMsgs: Msg[] = (ms as any).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content as string }));
        const nextMsgs: Msg[] = asMsgs.length === 0 && greeting ? [{ role: "assistant", content: greeting }] : asMsgs;
        setMessages(nextMsgs as Msg[]);
        setMessageCache((c) => ({ ...c, [activeCid]: nextMsgs as Msg[] }));
        const active = convs.find((c) => c.id === activeCid);
        if (active?.title) setChatName(active.title);
      } catch (e) {
        console.warn("load messages failed", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCid]);

  async function ensureConversation(): Promise<string | null> {
    if (activeCid) return activeCid;
    try {
      const resp = await fetch(`/api/bots/${encodeURIComponent(slug)}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: chatName || 'New Chat', visitor_id: visitorId }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Failed to create conversation');
      const c = json.conversation as { id: string; title: string; updated_at: string };
      setConvs((prev) => [{ id: c.id, title: c.title || 'New Chat', updated_at: c.updated_at }, ...prev]);
      setActiveCid(c.id);
      return c.id;
    } catch (e) {
      console.warn('auto create conversation failed', e);
      return null;
    }
  }

  // ——— Voice Chat: Browser Speech Recognition + Kokoro TTS ———
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");

  // Use a ref to store the send function to avoid stale closures
  const sendTextWithVoiceRef = useRef<((text: string) => Promise<void>) | null>(null);

  // Callback to handle voice transcript - will send as chat and speak response
  const handleVoiceTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    console.log("[Voice] Transcript received:", text);
    setVoiceTranscript(text);
    pendingVoiceTextRef.current = text; // Mark this as voice input to trigger TTS on response
    setPartial("");
    // Send the voice transcript as a chat message using ref to avoid stale closure
    if (sendTextWithVoiceRef.current) {
      console.log("[Voice] Calling sendTextWithVoice...");
      await sendTextWithVoiceRef.current(text);
    } else {
      console.warn("[Voice] sendTextWithVoiceRef is null!");
    }
  }, []);

  // Voice chat hook
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    speakTextStreaming,
    stopSpeaking,
    initAudio,
  } = useVoiceChat({
    onTranscript: handleVoiceTranscript,
    onPartial: setPartial,
    onError: (err) => console.warn("Voice error:", err),
  });

  // Combined voice active state
  const voiceActive = isListening || isSpeaking;

  function startVoice() {
    setVoiceModeEnabled(true);
    startListening();
  }

  function stopVoice() {
    stopListening();
    stopSpeaking();
    setVoiceModeEnabled(false);
    setPartial("");
  }

  // Send text and speak the response with streaming TTS (for voice mode)
  async function sendTextWithVoice(content: string) {
    if (loading) return;
    const text = content.trim();
    if (!text) return;

    const cidBefore = await ensureConversation();
    setMessages((m) => {
      const updated: Msg[] = [...m, { role: "user", content: text }];
      const id = activeCid || cidBefore;
      if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
      return updated;
    });
    setLoading(true);

    try {
      const history: Msg[] = messages.slice(-13);
      const payload = [...history, { role: "user", content: text }];
      const res = await fetch(`/api/bots/${encodeURIComponent(slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payload,
          conversationId: cidBefore ?? undefined,
          voiceMode: true // Use fast Ollama GPU for voice responses
        }),
      });

      let assistantAdded = false;
      let acc = "";
      const ensureAssistant = () => {
        if (assistantAdded) return;
        setMessages((m) => {
          const updated: Msg[] = [...m, { role: "assistant", content: "" }];
          const id = activeCid || cidBefore;
          if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
          return updated;
        });
        assistantAdded = true;
      };

      if (!res.ok || !res.body) {
        const bodyText = await res.text().catch(() => "Sorry, I couldn't respond.");
        ensureAssistant();
        acc = bodyText || "Sorry, I couldn't respond.";
        setMessages((m) => {
          const updated = [...m];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") last.content = acc;
          const id = activeCid || cidBefore;
          if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
          return updated as Msg[];
        });
        // Speak error message if voice mode
        if (voiceModeEnabled && acc) {
          await speakText(acc);
        }
      } else {
        ensureAssistant();

        // If voice mode enabled, use streaming TTS that speaks as text arrives
        if (voiceModeEnabled) {
          // Clone the response body so we can read it twice:
          // - once for TTS streaming
          // - once for UI text updates
          const [ttsStream, uiStream] = res.body.tee();

          // Start streaming TTS (speaks sentences as they complete)
          const ttsPromise = speakTextStreaming(ttsStream.getReader());

          // Simultaneously update UI with streamed text
          const reader = uiStream.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            acc += chunk;
            setMessages((m) => {
              const updated = [...m];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") last.content = acc;
              const id = activeCid || cidBefore;
              if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
              return updated as Msg[];
            });
          }

          // Wait for TTS to finish (audio queue will continue playing)
          await ttsPromise;
        } else {
          // Non-voice mode: just update UI
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            acc += chunk;
            setMessages((m) => {
              const updated = [...m];
              const last = updated[updated.length - 1];
              if (last && last.role === "assistant") last.content = acc;
              const id = activeCid || cidBefore;
              if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
              return updated as Msg[];
            });
          }
        }
      }
    } catch (e: any) {
      setMessages((m) => {
        const updated: Msg[] = [...m, { role: "assistant", content: e?.message || "Network error" }];
        if (activeCid) setMessageCache((c) => ({ ...c, [activeCid]: updated }));
        return updated;
      });
    } finally {
      setLoading(false);
      pendingVoiceTextRef.current = null;
    }
  }

  // Keep the ref updated with the latest sendTextWithVoice function
  sendTextWithVoiceRef.current = sendTextWithVoice;

  async function sendText(content: string) {
    // Prevent sending while waiting for a reply
    if (loading) return;
    const text = content.trim();
    if (!text) return;
    // Basic image detection (markdown image). Future: integrate vision API.
    const containsImage = /!\[[^\]]*\]\([^\)]+\)/.test(text);
    const cidBefore = await ensureConversation();
    setMessages((m) => {
      const updated: Msg[] = [...m, { role: "user", content: text }];
      const id = activeCid || cidBefore;
      if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
      return updated;
    });
    setLoading(true);
    try {
      // Keep last 13 messages (user/assistant) and append the new user message => 14 total context window
      const history: Msg[] = messages.slice(-13);
      const payload = [...history, { role: "user", content: text }];
      const res = await fetch(`/api/bots/${encodeURIComponent(slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload, conversationId: cidBefore ?? undefined }),
      });

      // Prepare a streaming assistant message placeholder
      let assistantAdded = false;
      let acc = "";
      const ensureAssistant = () => {
        if (assistantAdded) return;
        setMessages((m) => {
          const updated: Msg[] = [...m, { role: "assistant", content: "" }];
          const id = activeCid || cidBefore;
          if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
          return updated;
        });
        assistantAdded = true;
      };

      if (!res.ok || !res.body) {
        const bodyText = await res.text().catch(() => "Sorry, I couldn’t respond.");
        ensureAssistant();
        acc = bodyText || "Sorry, I couldn’t respond.";
        setMessages((m) => {
          const updated = [...m];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") last.content = acc;
          const id = activeCid || cidBefore;
          if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
          return updated as Msg[];
        });
      } else {
        ensureAssistant();
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          acc += chunk;
          setMessages((m) => {
            const updated = [...m];
            const last = updated[updated.length - 1];
            if (last && last.role === "assistant") last.content = acc;
            const id = activeCid || cidBefore;
            if (id) setMessageCache((c) => ({ ...c, [id]: updated }));
            return updated as Msg[];
          });
        }
      }

      // Post-stream: if conversation still has default title, auto-rename from first user line
      if (cidBefore) {
        const currentConv = convs.find(c => c.id === cidBefore);
        const hasDefaultTitle = currentConv?.title === 'New Chat' || !currentConv;
        if (hasDefaultTitle) {
          const autoTitle = (text.replace(/!\[[^\]]*\]\([^\)]+\)/g, '').trim() || 'New Chat').slice(0, 60);
          if (autoTitle !== 'New Chat') {
            setChatName(autoTitle);
            setConvs((prev) => prev.map(c => c.id === cidBefore ? { ...c, title: autoTitle, updated_at: new Date().toISOString() } : c));
            try {
              const response = await fetch(`/api/bots/${encodeURIComponent(slug)}/conversations/${cidBefore}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: autoTitle }),
              });
              if (response.ok) {
                console.log('Auto-renamed conversation to:', autoTitle);
              }
            } catch (e) {
              console.warn('Auto-rename failed', e);
            }
          }
        }
      }
    } catch (e: any) {
      setMessages((m) => {
        const updated: Msg[] = [...m, { role: "assistant", content: e?.message || "Network error" }];
        if (activeCid) setMessageCache((c) => ({ ...c, [activeCid]: updated }));
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Prevent sending while waiting for a reply
    if (loading) return;
    // If there's an image preview, use sendImageWithText instead
    if (imagePreview) {
      sendImageWithText();
      return;
    }
    const v = inputRef.current?.value ?? "";
    if (inputRef.current) inputRef.current.value = "";
    // Use voice mode send if enabled (will trigger streaming TTS)
    if (voiceModeEnabled) {
      sendTextWithVoice(v);
    } else {
      sendText(v);
    }
  }

  async function onRename() {
    const title = prompt("Edit chat name", chatName || "New Chat")?.trim();
    if (!title || !activeCid) return;
    try {
      // If this is a local-only conversation, update locally without server call
      if (activeCid.startsWith('local-')) {
        const now = new Date().toISOString();
        setChatName(title);
        setConvs((arr) => arr.map((c) => (c.id === activeCid ? { ...c, title, updated_at: now } : c)));
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(sessionsKey);
            if (raw) {
              const parsed = JSON.parse(raw) as { convs?: Array<{ id: string; title: string; updated_at: string }>; messages?: Record<string, Msg[]> };
              if (parsed?.convs) {
                parsed.convs = parsed.convs.map((c) => c.id === activeCid ? { ...c, title, updated_at: now } : c);
                localStorage.setItem(sessionsKey, JSON.stringify(parsed));
              }
            }
          } catch { }
        }
        return;
      }
      const updated = await renamePublicConversation(slug, activeCid, title);
      setChatName(updated.title);
      setConvs((arr) => arr.map((c) => (c.id === activeCid ? { ...c, title: updated.title, updated_at: updated.updated_at } : c)));
      // also persist to cache blob
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(sessionsKey);
          if (raw) {
            const parsed = JSON.parse(raw) as { convs?: Array<{ id: string; title: string; updated_at: string }>; messages?: Record<string, Msg[]> };
            if (parsed?.convs) {
              parsed.convs = parsed.convs.map((c) => c.id === activeCid ? { ...c, title: updated.title, updated_at: updated.updated_at } : c);
              localStorage.setItem(sessionsKey, JSON.stringify(parsed));
            }
          }
        } catch { }
      }
    } catch (e) {
      console.warn("rename failed", e);
    }
  }

  async function onNewChat() {
    try {
      if (activeCid) setMessageCache((c) => ({ ...c, [activeCid]: messages }));
      // Start with a generic title - it will be updated after the first user message
      const titleSuggestion = 'New Chat';
      const resp = await fetch(`/api/bots/${encodeURIComponent(slug)}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titleSuggestion, visitor_id: visitorId }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Failed to create conversation');
      const c = json.conversation as { id: string; title: string; updated_at: string };
      setConvs((prev) => [{ id: c.id, title: c.title || 'New Chat', updated_at: c.updated_at }, ...prev]);
      setActiveCid(c.id);
      setChatName(c.title || 'New Chat');
      const initial: Msg[] = greeting ? [{ role: 'assistant', content: greeting }] : [];
      setMessages(initial);
      setMessageCache((cache) => ({ ...cache, [c.id]: initial }));
    } catch (e) {
      console.warn('new chat failed', e);
      const tempId = `local-${crypto?.randomUUID ? crypto.randomUUID() : Date.now()}`;
      setConvs((prev) => [{ id: tempId, title: 'New Chat', updated_at: new Date().toISOString() }, ...prev]);
      setActiveCid(tempId);
      setChatName('New Chat');
      const initial: Msg[] = greeting ? [{ role: 'assistant', content: greeting }] : [];
      setMessages(initial);
      setMessageCache((cache) => ({ ...cache, [tempId]: initial }));
    }
  }

  async function onDeleteChat(id: string) {
    try {
      if (id.startsWith('local-')) {
        // local-only remove
      } else {
        await deletePublicConversation(slug, id);
      }
      setConvs((prev) => prev.filter((c) => c.id !== id));
      if (activeCid === id) {
        // Choose next conversation from updated list
        const remaining = convs.filter((c) => c.id !== id);
        const next = remaining[0];
        setActiveCid(next?.id || null);
        if (next?.id && messageCache[next.id]) {
          setMessages(messageCache[next.id]);
        } else {
          setMessages(greeting ? [{ role: "assistant", content: greeting }] : []);
        }
      }
      setMessageCache((cache) => { const { [id]: _removed, ...rest } = cache; return rest; });
      // remove from persisted cache
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(sessionsKey);
          if (raw) {
            const parsed = JSON.parse(raw) as { convs?: Array<{ id: string; title: string; updated_at: string }>; messages?: Record<string, Msg[]> };
            if (parsed) {
              if (parsed.convs) parsed.convs = parsed.convs.filter((c) => c.id !== id);
              if (parsed.messages) delete parsed.messages[id];
              localStorage.setItem(sessionsKey, JSON.stringify(parsed));
            }
          }
        } catch { }
      }
    } catch (e) {
      console.warn("delete failed", e);
    }
  }

  // Images -> We'll embed as Markdown image links in the message content for a simple MVP
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  function onPickImage() {
    fileRef.current?.click();
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(f);
  }
  async function sendImageWithText() {
    if (loading) return; // don't allow attaching while waiting
    if (!imagePreview) return;
    const text = inputRef.current?.value?.trim() || "";
    // Embed the image as Markdown with optional text
    const md = text ? `${text}\n\n![uploaded image](${imagePreview})` : `![uploaded image](${imagePreview})`;
    if (inputRef.current) inputRef.current.value = "";
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    await sendText(md);
  }

  const headerTitle = useMemo(() => name || "Chatbot", [name]);

  // Extract inline images from markdown and plain URLs, return clean text + images
  type ProductCard = { name: string; url: string; price?: string; product_id?: number; rating?: number; stock_status?: string; description?: string; category?: string; brand?: string; product_url?: string; image_urls?: string[] };
  function splitImages(md: string): { text: string; images: string[]; products: ProductCard[] } {
    let text = String(md || "");
    const images: string[] = [];
    const products: ProductCard[] = [];

    // 1) Parse [PRODUCT_GRID:JSON] blocks — emitted by backend before LLM tokens
    text = text.replace(/\[PRODUCT_GRID:(\[[\s\S]*?\])\]/g, (_m, json) => {
      try {
        const items = JSON.parse(json) as ProductCard[];
        products.push(...items.filter(p => p?.url).map(p => {
          // Resolve GPU image URLs through HTTPS proxy
          let url = p.url;
          const imgMatch = url.match(/^https?:\/\/[^/]+(\/images\/.+)$/);
          if (imgMatch) url = `/api/img${imgMatch[1]}`;
          else if (url.startsWith('/images/')) url = `/api/img${url}`;
          return { ...p, url };
        }));
      } catch { }
      return "";
    });

    // 2) Strip [PRODUCT_IMAGE:Name] placeholders the LLM generates on its own
    text = text.replace(/\[PRODUCT_IMAGE:[^\]]*\]/gi, "");

    // 2b) Strip [img1]-[img99] and [img1.1] product image codes (used by LLM for image selection)
    text = text.replace(/\[img\d+(?:\.\d+)?\]/g, "");

    // 3) markdown images ![alt](url)
    text = text.replace(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi, (_m, url) => {
      images.push(String(url));
      return "";
    });
    // 4) linked images [alt](url) -> treat as image if looks like one
    text = text.replace(/\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/gi, (_m, url) => {
      const u = String(url);
      if (/\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(u)) { images.push(u); return ""; }
      return _m;
    });
    // 5) bare image URLs
    text = text.replace(/(^|\s)(https?:\/\/[^\s)]+?\.(?:png|jpe?g|webp|gif)(?:\?[^\s)]*)?)(?=$|\s)/gi, (_m, pre, url) => {
      images.push(String(url));
      return String(pre || " ");
    });
    // 6) Normalize Unicode bullets (•) to markdown list items
    text = text.replace(/^[•●]\s*/gm, '- ');
    text = text.replace(/\n[•●]\s*/g, '\n- ');
    return { text: text.trim(), images, products };
  }


  // ── Inline Voice: startRecording / stopRecording / toggleRecording ──
  const startVoiceRecording = useCallback(async () => {
    try {
      // Ensure a conversation exists BEFORE connecting WebSocket
      // so all voice messages can be saved to the DB
      const cid = await ensureConversation();
      if (cid) activeCidRef.current = cid;
      console.log(`[Voice] Ensured conversation: ${cid || activeCidRef.current}`);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      voiceStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      voiceAudioCtxRef.current = ctx;
      console.log(`[Voice] AudioContext sample rate: ${ctx.sampleRate}Hz`);

      await ctx.audioWorklet.addModule('/pcm-processor.js');

      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = process.env.NEXT_PUBLIC_CHATBOT_VOICE_WS_URL || `${wsProtocol}://${window.location.host}`;
      const ws = new WebSocket(`${wsUrl}/ws/voice?api_key=test-key-1`);
      voiceWsRef.current = ws;

      let fullResponse = "";
      const audioQueue: Blob[] = [];
      const sentenceQueue: string[] = [];
      const audioMetaQueue: { duration_ms: number; word_count: number }[] = [];
      let displayedText = "";
      let isPlayingAudio = false;
      let currentAudio: HTMLAudioElement | null = null;
      let streamingMsgAdded = false;
      let typingInterval: ReturnType<typeof setInterval> | null = null;
      let pendingImageMarkdown = ""; // Images to append after typing finishes
      let doneReceived = false;

      const stopAllAudio = () => {
        if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
        if (currentAudio) { currentAudio.pause(); currentAudio.src = ""; currentAudio = null; }
        audioQueue.length = 0;
        sentenceQueue.length = 0;
        audioMetaQueue.length = 0;
        isPlayingAudio = false;
        setIsVoiceTyping(false);
      };

      const playNextAudio = () => {
        if (audioQueue.length === 0 || isPlayingAudio) return;
        isPlayingAudio = true;
        const chunk = audioQueue.shift()!;
        const sentence = sentenceQueue.shift();

        if (sentence) {
          const words = sentence.split(' ');
          let wordIndex = 0;
          const baseText = displayedText;
          const prefix = baseText ? '\n' : '';
          const meta = audioMetaQueue.shift();
          const intervalMs = meta
            ? Math.max(50, (meta.duration_ms * 0.7) / meta.word_count)
            : Math.max(60, Math.min(120, 2000 / words.length));

          setIsVoiceTyping(true);

          if (!streamingMsgAdded) {
            streamingMsgAdded = true;
            setMessages(prev => [...prev, { role: "assistant", content: baseText + prefix + words[0] }]);
            wordIndex = 1;
          }

          typingInterval = setInterval(() => {
            if (wordIndex < words.length) {
              const partial = words.slice(0, wordIndex + 1).join(' ');
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: baseText + prefix + partial };
                return updated;
              });
              wordIndex++;
            } else {
              clearInterval(typingInterval!);
              typingInterval = null;
              displayedText = baseText + prefix + sentence;
              setIsVoiceTyping(false);
              // If done was already received and no more audio, append images now
              if (doneReceived && audioQueue.length === 0 && pendingImageMarkdown) {
                const finalContent = displayedText + pendingImageMarkdown;
                pendingImageMarkdown = "";
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") last.content = finalContent;
                  return updated;
                });
              }
            }
          }, intervalMs);
        }

        const url = URL.createObjectURL(chunk);
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudio = null;
          isPlayingAudio = false;
          if (typingInterval) {
            const waitForTyping = setInterval(() => {
              if (!typingInterval) { clearInterval(waitForTyping); playNextAudio(); }
            }, 50);
          } else {
            playNextAudio();
          }
        };
        audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; isPlayingAudio = false; playNextAudio(); };
        audio.play().catch(() => { currentAudio = null; isPlayingAudio = false; playNextAudio(); });
      };

      ws.onopen = () => {
        console.log("[Voice] WS connected, streaming 16kHz PCM...");
        ws.send(JSON.stringify({
          type: "config",
          mode: "stream",
          sample_rate: 16000,
          chatbot_id: botId || null,
          system_prompt: directive || null,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }));

        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, 'pcm-processor');
        voiceWorkletRef.current = workletNode;

        workletNode.port.onmessage = (e) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(e.data);
        };

        source.connect(workletNode);
        workletNode.connect(ctx.destination);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          audioQueue.push(event.data);
          playNextAudio();
          return;
        }
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcription") {
            console.log(`[Voice] Transcription: "${data.text}" (${data.latency_ms}ms)`);
            const userMsg: Msg = { role: "user", content: `🎤 ${data.text}` };
            const currentCid = activeCidRef.current;
            setMessages(prev => {
              const updated = [...prev, userMsg];
              if (currentCid) setMessageCache(c => ({ ...c, [currentCid]: updated }));
              return updated;
            });
            // Save user message to server
            if (currentCid) {
              fetch(`/api/bots/${encodeURIComponent(slug)}/conversations/${currentCid}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'user', content: `🎤 ${data.text}` }),
              }).catch(e => console.warn('[Voice] Save user msg failed:', e));
            } else {
              console.warn('[Voice] No conversation ID — user message NOT saved');
            }
          } else if (data.type === "llm_sentence") {
            sentenceQueue.push(data.text);
            console.log(`[Voice] Sentence queued: "${data.text}"`);
          } else if (data.type === "audio_meta") {
            audioMetaQueue.push({ duration_ms: data.duration_ms, word_count: data.word_count });
          } else if (data.type === "vad_speech_start") {
            console.log("[Voice] GPU detected speech start");
            // Only cancel if audio is playing (real barge-in)
            if (isPlayingAudio || audioQueue.length > 0) {
              console.log("[Voice] Barge-in: stopping audio, heard:", displayedText?.slice(0, 60));
              // Send what was actually heard BEFORE clearing
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "cancel", heard_response: displayedText }));
              }
              stopAllAudio();
            }
            fullResponse = "";
            displayedText = "";
            streamingMsgAdded = false;
            setIsProcessingVoice(true);
          } else if (data.type === "vad_speech_end") {
            console.log("[Voice] GPU detected speech end");
          } else if (data.type === "done") {
            fullResponse = data.full_response || "";
            const imageMap = data.image_map || {};
            console.log(`[Voice] Done: ${data.total_pipeline_ms}ms, first audio: ${data.first_audio_ms}ms, images: ${Object.keys(imageMap).length}`);
            // Strip [imgN] from displayed text and build product image grid
            let displayContent = fullResponse.replace(/\[img\d+(?:\.\d+)?\]\s*/g, "").trim();
            // Build image markdown
            const imageUrls = Object.values(imageMap) as string[];
            const imgMarkdown = imageUrls.length > 0
              ? "\n\n" + imageUrls.map((url: string) => `![product](${url})`).join("\n")
              : "";
            fullResponse = displayContent;
            doneReceived = true;
            // If typing is still running, store images for later
            if (typingInterval || isPlayingAudio || audioQueue.length > 0) {
              pendingImageMarkdown = imgMarkdown;
            } else {
              // Typing is done, append images immediately
              fullResponse = displayContent + imgMarkdown;
            }
            const doneCid = activeCidRef.current;
            if (!streamingMsgAdded && fullResponse) {
              const assistantMsg: Msg = { role: "assistant", content: fullResponse };
              setMessages(prev => {
                const updated = [...prev, assistantMsg];
                if (doneCid) setMessageCache(c => ({ ...c, [doneCid]: updated }));
                return updated;
              });
              streamingMsgAdded = true;
            } else if (streamingMsgAdded && fullResponse) {
              // Update the last assistant message with full response (it may have been partial from typing)
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "assistant") last.content = fullResponse;
                if (doneCid) setMessageCache(c => ({ ...c, [doneCid]: updated }));
                return updated;
              });
            }
            // Save assistant message to server (always include images)
            const saveContent = (fullResponse + pendingImageMarkdown).trim();
            if (doneCid && saveContent) {
              fetch(`/api/bots/${encodeURIComponent(slug)}/conversations/${doneCid}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'assistant', content: saveContent }),
              }).catch(e => console.warn('[Voice] Save assistant msg failed:', e));
            } else if (!doneCid) {
              console.warn('[Voice] No conversation ID — assistant message NOT saved');
            }
            // Tell backend what user actually heard (full response since no barge-in)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "heard", heard_response: fullResponse }));
            }
            fullResponse = "";
            setIsProcessingVoice(false);
          }
        } catch (e) { console.warn("[Voice] Parse error:", e); }
      };

      ws.onerror = (e) => { console.error("[Voice] WS Error:", e); setIsProcessingVoice(false); };
      ws.onclose = () => { console.log("[Voice] WS Closed"); setIsProcessingVoice(false); };

      setIsVoiceRecording(true);
    } catch (e: any) {
      console.error("Mic error:", e);
      if (e.name === "NotFoundError") alert("No microphone found.");
      else if (e.name === "NotAllowedError") alert("Microphone access denied.");
      else alert("Could not access microphone: " + e.message);
    }
  }, [messages, botId, directive, slug]);

  const stopVoiceRecording = useCallback(() => {
    if (voiceWorkletRef.current) { voiceWorkletRef.current.disconnect(); voiceWorkletRef.current = null; }
    if (voiceAudioCtxRef.current) { voiceAudioCtxRef.current.close(); voiceAudioCtxRef.current = null; }
    if (voiceStreamRef.current) { voiceStreamRef.current.getTracks().forEach(t => t.stop()); voiceStreamRef.current = null; }
    if (voiceWsRef.current && voiceWsRef.current.readyState === WebSocket.OPEN) {
      voiceWsRef.current.send(JSON.stringify({ type: "stop" }));
      voiceWsRef.current.close();
      voiceWsRef.current = null;
    }
    setIsVoiceRecording(false);
    setIsProcessingVoice(false);
    console.log("[Voice] Stopped");
  }, []);

  const toggleVoiceRecording = () => {
    if (isVoiceRecording) stopVoiceRecording();
    else startVoiceRecording();
  };

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      @keyframes msgFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
    <div className={`relative flex ${isEmbed ? 'h-full' : 'h-[100dvh]'} overflow-hidden ${bgMain}`} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Hidden audio element for realtime TTS playback */}
      <audio
        ref={audioElRef as any}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {(
      <div
        className={
          `fixed inset-y-0 left-0 z-40 w-64 sm:w-72 border-r ${borderClr} ${bgPanel} ` +
          `flex flex-col transform transition-transform duration-300 ease-in-out ` +
          `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ` +
          `md:static md:translate-x-0 shadow-xl md:shadow-none`
        }
        role="complementary"
        aria-label="Conversations sidebar"
      >
        {/* Sidebar Header */}
        <div className={`p-3 flex items-center justify-between border-b ${borderClr}`}>
          <div className="font-semibold truncate text-sm">{headerTitle}</div>
          <button
            onClick={onNewChat}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${light
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-white text-black hover:bg-gray-200'
              }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
          {convs.map((c) => {
            const isActive = activeCid === c.id;
            const timeAgo = c.updated_at ? (() => {
              const diff = Date.now() - new Date(c.updated_at).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return 'Just now';
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ago`;
              const days = Math.floor(hrs / 24);
              return `${days}d ago`;
            })() : '';
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (activeCid) setMessageCache((cache) => ({ ...cache, [activeCid]: messages }));
                  setActiveCid(c.id);
                  setSidebarOpen(false);
                }}
                className={`group w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-start gap-2.5 ${isActive
                    ? light
                      ? 'bg-gray-100 border-l-2 border-l-black'
                      : 'bg-white/[0.06] border-l-2 border-l-white'
                    : light
                      ? 'hover:bg-gray-50 border-l-2 border-l-transparent'
                      : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                  }`}
              >
                {/* Chat icon */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`mt-0.5 flex-shrink-0 transition-colors ${isActive
                      ? light ? 'text-black' : 'text-white'
                      : light ? 'text-gray-400 group-hover:text-gray-600' : 'text-gray-600 group-hover:text-gray-400'
                    }`}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {/* Title + timestamp */}
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-medium transition-colors ${isActive
                      ? light ? 'text-black' : 'text-white'
                      : light ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                    {c.title || 'Untitled'}
                  </div>
                  {timeAgo && (
                    <div className={`text-[11px] mt-0.5 ${light ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {timeAgo}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom toolbar — compact with dropdown */}
        <div className={`p-2 border-t ${borderClr}`}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSidebarMenuOpen((v) => !v)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${light
                  ? 'hover:bg-gray-100 text-gray-600'
                  : 'hover:bg-white/[0.06] text-gray-400'
                }`}
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`transition-transform duration-200 ${sidebarMenuOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {sidebarMenuOpen && (
              <div className={`absolute bottom-full left-0 right-0 mb-1 rounded-lg border overflow-hidden shadow-xl ${light
                  ? 'bg-white border-gray-200'
                  : 'bg-[#1a1a1a] border-gray-800'
                }`}>
                <button
                  type="button"
                  onClick={() => { setLight((v) => !v); setSidebarMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${light ? 'hover:bg-gray-50 text-gray-700' : 'hover:bg-white/[0.06] text-gray-300'
                    }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    {light
                      ? <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
                      : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    }
                  </svg>
                  {light ? 'Dark Mode' : 'Light Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => { onRename(); setSidebarMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${light ? 'hover:bg-gray-50 text-gray-700' : 'hover:bg-white/[0.06] text-gray-300'
                    }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename Chat
                </button>
                <button
                  type="button"
                  onClick={() => { if (activeCid) onDeleteChat(activeCid); setSidebarMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-red-400 ${light ? 'hover:bg-red-50' : 'hover:bg-red-500/10'
                    }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top bar with bot avatar and chat name */}
        <div className={`p-2 sm:p-3 border-b ${borderClr} ${bgPanel} flex items-center justify-between sticky top-0 z-10`}>
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger for mobile */}
            <button
              type="button"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden mr-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border ${borderInput} transition-colors ${light ? 'hover:bg-gray-100' : 'hover:bg-[#141414]'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <img src={avatarUrl || "/favicon.ico"} onError={(e) => ((e.currentTarget.src = "/favicon.ico"))} className={`w-7 h-7 flex-shrink-0 rounded-full border ${light ? "border-gray-300" : "border-gray-700"}`} alt="avatar" />
            <div className="min-w-0">
              <div className={`font-semibold text-sm md:text-base truncate`}>{chatName}</div>
            </div>
          </div>
          <div className="hidden sm:flex gap-2 flex-shrink-0">
            <button onClick={onRename} className={`text-xs md:text-sm px-2 py-1 border ${borderInput} rounded-md transition-colors ${light ? "hover:bg-gray-100" : "hover:bg-[#141414]"}`}>Edit Chat Name</button>
            <button onClick={() => activeCid && onDeleteChat(activeCid)} className={`text-xs md:text-sm px-2 py-1 border ${borderInput} rounded-md transition-colors ${light ? "hover:bg-gray-100" : "hover:bg-[#141414]"}`}>Delete Chat</button>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-6 space-y-4 ${bgPanel}`}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animation: 'fadeInMsg 0.3s ease-out both', animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
            >
              {/* Assistant avatar */}
              {m.role === "assistant" && (
                <div className="flex-shrink-0 mr-2.5 mt-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${light ? 'bg-gray-100 border border-gray-200' : 'bg-white/[0.06] border border-white/10'
                    }`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className={light ? 'text-gray-500' : 'text-gray-400'}
                    >
                      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                      <path d="M18 14h.5a3.5 3.5 0 0 1 0 7H5.5a3.5 3.5 0 0 1 0-7H6" />
                      <path d="M6 14a6 6 0 0 1 12 0" />
                    </svg>
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] text-sm md:text-[15px] leading-relaxed ${m.role === "user"
                    ? `px-4 py-3 ${radius} shadow-sm ${light ? 'bg-black text-white' : 'bg-[#2a2a2e] text-white'}`
                    : 'py-2'
                  }`}
                style={{
                  animation: 'msgFadeIn 0.4s ease-out both',
                  wordBreak: 'break-word' as const,
                  overflowWrap: 'anywhere' as const,
                  ...(m.role !== "user" ? {
                    color: bubbleBotText,
                  } : {}),
                }}
              >
                {(() => {
                  if (m.role !== 'assistant') {
                    return <RenderedMessage content={m.content} light={light} />;
                  }
                  const { text, images, products } = splitImages(m.content);
                  return (
                    <>
                      {/* Product cards grid (from [PRODUCT_GRID:JSON]) */}
                      {products.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-3">
                          {products.map((p, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden border border-neutral-700/50 bg-black/20 hover:border-amber-600/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/30 cursor-pointer" onClick={() => setSelectedProduct(p as ProductDetail)}>
                              <img src={p.url} alt={p.name} loading="lazy" className="w-full h-44 object-contain bg-white/5 p-2" />
                              <div className="p-2.5">
                                <p className="text-xs font-semibold truncate">{p.name}</p>
                                {p.price && <p className="text-xs text-green-400 mt-0.5">{p.price}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Inline images from markdown */}
                      {images.length > 0 && (
                        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {images.slice(0, 6).map((src, idx) => (
                            <img key={idx} src={src} alt="image" loading="lazy" className="block w-full h-auto rounded-lg border border-neutral-700/50" />
                          ))}
                        </div>
                      )}
                      {text && <RenderedMessage content={text} light={light} />}
                      {!text && images.length === 0 && products.length === 0 && <RenderedMessage content={m.content} light={light} />}
                    </>
                  );
                })()}

                {m.role === "assistant" && shouldShowActionButtons(m.content) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] md:text-xs">
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-md border transition-all ${light ? 'border-gray-200 hover:bg-gray-100 text-gray-600' : 'border-white/10 hover:bg-white/[0.06] text-gray-400 hover:text-gray-200'}`}
                      onClick={() => !loading && sendText(`Explain: ${m.content}`)}
                    >
                      Explain
                    </button>
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-md border transition-all ${light ? 'border-gray-200 hover:bg-gray-100 text-gray-600' : 'border-white/10 hover:bg-white/[0.06] text-gray-400 hover:text-gray-200'}`}
                      onClick={() => !loading && sendText(`Show steps for: ${m.content}`)}
                    >
                      Show Steps
                    </button>
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-md border transition-all ${light ? 'border-gray-200 hover:bg-gray-100 text-gray-600' : 'border-white/10 hover:bg-white/[0.06] text-gray-400 hover:text-gray-200'}`}
                      onClick={() => !loading && sendText(`Give me a similar problem to practice based on: ${m.content}`)}
                    >
                      Try Similar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typingIndicator && loading && (
            <div className="flex items-center gap-2.5" style={{ animation: 'fadeInMsg 0.3s ease-out both' }}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${light ? 'bg-gray-100 border border-gray-200' : 'bg-white/[0.06] border border-white/10'
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  className={light ? 'text-gray-500' : 'text-gray-400'}
                >
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M18 14h.5a3.5 3.5 0 0 1 0 7H5.5a3.5 3.5 0 0 1 0-7H6" />
                  <path d="M6 14a6 6 0 0 1 12 0" />
                </svg>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg ${light ? 'bg-gray-50' : 'bg-white/[0.03]'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0s' }} />
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0.15s' }} />
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-gray-400' : 'bg-gray-500'}`} style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          {/* Starter question chips intentionally hidden for a cleaner greeting */}
        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className={`p-2 md:p-3 ${bgPanel} border-t ${borderClr}`}>
          <div className="flex items-center gap-2">
            <input ref={inputRef} className={`flex-1 min-w-0 border ${borderInput} ${light ? "bg-white text-black" : "bg-[#141414] text-white"} rounded-xl px-2 sm:px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 text-sm transition-shadow focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]`} placeholder={tagline || "Ask me Anything…"} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={isProcessingVoice || loading}
              className={`px-2 sm:px-3 py-2 border rounded-xl transition-all hover:scale-105 ${isVoiceRecording
                  ? "bg-green-500/15 border-green-500 text-green-400"
                  : isProcessingVoice
                    ? "bg-yellow-500/15 border-yellow-500 text-yellow-400"
                    : `${borderInput} bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 ${light ? "border-indigo-300" : "border-indigo-500/50"}`
                }`}
              title={isVoiceRecording ? "Stop voice" : isProcessingVoice ? "Processing..." : "Start voice"}
              style={isVoiceRecording ? { animation: "pulse 1s infinite" } : {}}
            >
              <span className="flex items-center gap-1.5">
                {isProcessingVoice ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" /></svg>
                ) : isVoiceRecording ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: brandColor }}>
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
                <span className="text-xs hidden sm:inline" style={isVoiceRecording ? { color: '#22c55e' } : isProcessingVoice ? { color: '#f59e0b' } : { color: brandColor }}>
                  {isVoiceRecording ? "Stop" : isProcessingVoice ? "..." : "Voice"}
                </span>
              </span>
            </button>
            <button type="button" onClick={onPickImage} className={`px-2 py-2 border rounded-xl flex-shrink-0 ${borderInput} transition-colors ${light ? "hover:bg-gray-100" : "hover:bg-[#141414]"}`}>📷</button>
            <button type="submit" disabled={loading} className={`px-2 sm:px-3 py-2 border rounded-xl text-xs sm:text-sm flex-shrink-0 transition-shadow hover:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]`} style={{ borderColor: brandColor, color: brandColor }}>{loading ? '…' : 'Send'}</button>
          </div>
          {(partial || voiceTranscript) && (
            <div className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">
              {partial ? `Listening: ${partial}` : voiceTranscript}
            </div>
          )}
          {imagePreview && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded" />
              <div className="flex gap-2">
                <button type="button" className={`px-2 py-1 border rounded-xl ${borderInput} transition-colors ${light ? "hover:bg-gray-100" : "hover:bg-[#141414]"}`} onClick={sendImageWithText}>Send with Photo</button>
                <button type="button" className={`px-2 py-1 border rounded-xl ${borderInput} transition-colors ${light ? "hover:bg-gray-100" : "hover:bg-[#141414]"}`} onClick={() => { setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}>Cancel</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
    {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
  </>
  );
}

// (Legacy renderMathAndMarkdown removed in favor of ReactMarkdown + rehype-katex implementation.)
