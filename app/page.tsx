"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import ScrapeProgress from "@/components/builder/ScrapeProgress";

const devNoAuth =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_DEV_NO_AUTH === "true";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotConfig {
  name: string;
  greeting: string;
  directive: string;
  starterQuestions: string[];
  theme: string;
  brandColor: string;
  websiteToScrape?: string | null;
  slug: string;
}

interface CreatedChatbot {
  id: string;
  name: string;
  slug: string;
}

export default function Home() {
  const { data: session, status: authStatus } = useSession();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdBot, setCreatedBot] = useState<CreatedChatbot | null>(null);
  const [createdAtIndex, setCreatedAtIndex] = useState<number | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [typedSubtitle, setTypedSubtitle] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isVoiceTyping, setIsVoiceTyping] = useState(false);
  // Knowledge source upload
  const [knowledgeFiles, setKnowledgeFiles] = useState<{name: string; content: string; size: number}[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [scrapeJobId, setScrapeJobId] = useState<string | null>(null);
  const knowledgeInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const createdBotRef = useRef<CreatedChatbot | null>(null);

  // Keep ref in sync with state for WebSocket closures
  useEffect(() => { createdBotRef.current = createdBot; }, [createdBot]);

  const SUBTITLE = "Create AI chat agents and voice agents by chatting with AI";

  // ── Multi-session storage (GPU backend + localStorage fallback) ──
  type BuilderSession = { id: string; title: string; messages: Message[]; createdBot: CreatedChatbot | null; createdAtIndex: number | null; updatedAt: string };
  const SESSIONS_KEY = "botforge-sessions";
  const ACTIVE_KEY = "botforge-active";
  const [sessions, setSessions] = useState<BuilderSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const userEmail = session?.user?.email || null;

  const saveLocalSessions = (s: BuilderSession[]) => {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s.slice(0, 20))); } catch {}
  };

  const inChat = messages.length > 0;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ── Load sessions on mount ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      // Try backend first if logged in
      if (userEmail) {
        try {
          const res = await fetch(`/api/builder-sessions?email=${encodeURIComponent(userEmail)}`);
          if (res.ok) {
            const data = await res.json();
            const backendSessions: BuilderSession[] = (data.sessions || []).map((s: any) => ({
              id: s.id, title: s.title || "Chat", messages: [],
              createdBot: s.created_bot_id ? { id: s.created_bot_id, name: s.title, slug: s.created_bot_slug || "" } : null,
              createdAtIndex: null, updatedAt: s.updated_at || s.created_at || new Date().toISOString(),
            }));
            if (backendSessions.length > 0) {
              setSessions(backendSessions);
              saveLocalSessions(backendSessions);
              const savedActiveId = localStorage.getItem(ACTIVE_KEY);
              const active = backendSessions.find(s => s.id === savedActiveId) || backendSessions[0];
              setActiveSessionId(active.id);
              localStorage.setItem(ACTIVE_KEY, active.id);
              // Load messages for active session
              try {
                const msgRes = await fetch(`/api/builder-sessions/${active.id}`);
                if (msgRes.ok) {
                  const msgData = await msgRes.json();
                  const msgs: Message[] = (msgData.messages || []).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));
                  if (msgs.length > 0) {
                    setMessages(msgs);
                    // Check if any message mentions a created bot
                    const botSession = backendSessions.find(s => s.id === active.id);
                    if (botSession?.createdBot) setCreatedBot(botSession.createdBot);
                  }
                }
              } catch {}
              setHasLoadedHistory(true);
              return;
            }
          }
        } catch (e) { console.warn("Failed to load backend sessions:", e); }
      }

      // Fallback to localStorage
      let loaded: BuilderSession[] = [];
      try { loaded = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch {}

      // Migrate from old single-session format
      if (loaded.length === 0) {
        try {
          const old = localStorage.getItem("botforge-chat-session");
          if (old) {
            const p = JSON.parse(old);
            if (p.messages?.length > 0) {
              const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
              const migrated: BuilderSession = {
                id, title: p.messages.find((m: Message) => m.role === "user")?.content.slice(0, 45) || "Chat",
                messages: p.messages, createdBot: p.createdBot || null, createdAtIndex: p.createdAtIndex ?? null, updatedAt: new Date().toISOString(),
              };
              loaded.push(migrated);
              saveLocalSessions(loaded);
              localStorage.removeItem("botforge-chat-session");
            }
          }
        } catch {}
      }

      setSessions(loaded);
      const savedActiveId = localStorage.getItem(ACTIVE_KEY);
      const active = loaded.find(s => s.id === savedActiveId) || loaded[0];
      if (active) {
        setActiveSessionId(active.id);
        setMessages(active.messages);
        setCreatedBot(active.createdBot);
        setCreatedAtIndex(active.createdAtIndex);
        localStorage.setItem(ACTIVE_KEY, active.id);
      }
      setHasLoadedHistory(true);
    })();
  }, [userEmail]);

  // ── Save messages to backend after each change ──
  const lastSavedMsgCount = useRef(0);
  useEffect(() => {
    if (!hasLoadedHistory || !activeSessionId || messages.length === 0) return;
    // Save to localStorage cache
    setSessions(prev => {
      const title = messages.find(m => m.role === "user")?.content.replace(/^🎤\s*/, "").slice(0, 45) || "New Chat";
      const updated = prev.map(s => s.id === activeSessionId ? { ...s, messages, createdBot, createdAtIndex, updatedAt: new Date().toISOString(), title } : s);
      saveLocalSessions(updated);
      return updated;
    });
    // Save new messages to backend (only if activeSessionId is a valid UUID from backend)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (userEmail && activeSessionId && isUUID.test(activeSessionId) && messages.length > lastSavedMsgCount.current && !isLoading) {
      const newMsgs = messages.slice(lastSavedMsgCount.current);
      lastSavedMsgCount.current = messages.length;
      fetch(`/api/builder-sessions/${activeSessionId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role: m.role, content: m.content })) }),
      }).catch(e => console.warn("Failed to save messages:", e));
    }
  }, [messages, createdBot, createdAtIndex, hasLoadedHistory, activeSessionId, isLoading]);

  // Switch to a different session
  const switchSession = async (id: string) => {
    const s = sessions.find(s => s.id === id);
    if (!s) return;
    setActiveSessionId(id);
    setInput("");
    localStorage.setItem(ACTIVE_KEY, id);
    setShowRecentChats(false);
    // Load messages from backend if available
    if (userEmail) {
      try {
        const res = await fetch(`/api/builder-sessions/${id}`);
        if (res.ok) {
          const data = await res.json();
          const msgs: Message[] = (data.messages || []).map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));
          setMessages(msgs);
          lastSavedMsgCount.current = msgs.length;
          if (s.createdBot) setCreatedBot(s.createdBot);
          else setCreatedBot(null);
          setCreatedAtIndex(null);
          return;
        }
      } catch {}
    }
    // Fallback to cached messages
    setMessages(s.messages);
    setCreatedBot(s.createdBot);
    setCreatedAtIndex(s.createdAtIndex);
    lastSavedMsgCount.current = s.messages.length;
  };

  const deleteSession = async (id: string) => {
    // Delete from backend
    if (userEmail) {
      fetch(`/api/builder-sessions/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      saveLocalSessions(next);
      if (id === activeSessionId) {
        if (next.length) { switchSession(next[0].id); } else { setMessages([]); setCreatedBot(null); setCreatedAtIndex(null); setActiveSessionId(null); localStorage.removeItem(ACTIVE_KEY); }
      }
      return next;
    });
  };

  const relTime = (iso: string) => {
    const d = Date.now() - new Date(iso).getTime();
    if (d < 60000) return "now";
    if (d < 3600000) return `${Math.floor(d / 60000)}m`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h`;
    return `${Math.floor(d / 86400000)}d`;
  };

  // ── Typing effect ──
  useEffect(() => {
    if (inChat) return;
    setTypedSubtitle("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedSubtitle(SUBTITLE.slice(0, i));
      if (i >= SUBTITLE.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [inChat]);

  // ── Auto-resize textarea ──
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, createdBot]);

  // ── Focus on mount ──
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── Create chatbot ──
  const createChatbot = async (config: ChatbotConfig) => {
    setIsCreating(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "⏳ Creating your chatbot..." }]);
    try {
      const res = await fetch("/api/ai-generator/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }) });
      const data = await res.json();
      if (data.error) {
        const isLimitError = res.status === 403 || (data.error && data.error.toLowerCase().includes("limit"));
        setMessages((prev) => { const m = [...prev]; m[m.length - 1] = { role: "assistant", content: isLimitError ? `⚠️ **Chatbot Limit Reached**\n\n${data.error}\n\n🚀 [Upgrade your plan](/pricing) to create more chatbots!` : "❌ Error: " + data.error }; return m; });
        return;
      }
      if (data.chatbot) {
        setCreatedBot({ id: data.chatbot.id, name: data.chatbot.name, slug: data.chatbot.slug });
        // If scraping was triggered, capture job_id for progress UI
        if (data.job_id) {
          setScrapeJobId(data.job_id);
        }
        const embedScript = `<script src="${origin}/embed/widget.js" data-slug="${data.chatbot.slug}" data-mode="float" defer></script>`;
        setMessages((prev) => {
          const m = [...prev];
          m[m.length - 1] = { role: "assistant", content: `🎉 **Your chatbot "${data.chatbot.name}" is ready!**\n\n📋 **Embed on your website** — copy this code:\n\n\`\`\`html\n${embedScript}\n\`\`\`\n\n🔗 **Live link:** [${origin}/c/${data.chatbot.slug}](${origin}/c/${data.chatbot.slug})${config.websiteToScrape ? "\n\n⏳ Scraping website content..." : ""}` };
          setCreatedAtIndex(m.length - 1);
          return m;
        });
      }
    } catch {
      setMessages((prev) => { const m = [...prev]; m[m.length - 1] = { role: "assistant", content: "❌ Network error. Please try again." }; return m; });
    } finally { setIsCreating(false); }
  };

  // ── Update chatbot ──
  const updateChatbot = async (botId: string, changes: Record<string, any>) => {
    setIsCreating(true);
    try {
      const res = await fetch(`/api/admin/chatbots/${botId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages((prev) => { const m = [...prev]; m[m.length - 1] = { role: "assistant", content: "❌ Error: " + (data.error || "Unknown") }; return m; });
        return;
      }
      const list = Object.keys(changes).map((f) => `✅ ${f} updated`).join("\n");
      if (changes.name && createdBot) setCreatedBot({ ...createdBot, name: changes.name });
      setIframeKey((k) => k + 1);
      setMessages((prev) => { const m = [...prev]; m[m.length - 1] = { role: "assistant", content: `🎉 **Changes applied!**\n\n${list}\n\nYour chatbot has been updated!` }; return m; });
    } catch {
      setMessages((prev) => { const m = [...prev]; m[m.length - 1] = { role: "assistant", content: "❌ Network error." }; return m; });
    } finally { setIsCreating(false); }
  };

  // ── Fetch bot settings ──
  const fetchBotSettings = async () => {
    if (!createdBot) return null;
    try {
      const res = await fetch(`/api/admin/chatbots/${createdBot.id}`);
      if (!res.ok) return null;
      const bot = await res.json();
      return { name: bot.name || "", greeting: bot.greeting || "", directive: bot.directive || "", starterQuestions: bot.starter_questions || [], brandColor: bot.brand_color || "", theme: bot.theme_template || "" };
    } catch { return null; }
  };

  // ── Send message ──
  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    // Prepend knowledge context if files are uploaded
    let enrichedMsg = msg;
    if (knowledgeFiles.length > 0) {
      const knowledgeText = knowledgeFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n');
      enrichedMsg = `[KNOWLEDGE_SOURCE]\n${knowledgeText}\n[/KNOWLEDGE_SOURCE]\n\n${msg}`;
    }
    const newMsgs: Message[] = [...messages, { role: "user", content: msg }];
    const msgsForApi: Message[] = [...messages, { role: "user", content: enrichedMsg }];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);
    try {
      const currentBotSettings = await fetchBotSettings();
      const res = await fetch("/api/ai-generator/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: msgsForApi, currentBotSettings }) });

      const contentType = res.headers.get("content-type") || "";

      // ── Streaming text response (conversation) ──
      if (contentType.includes("text/plain")) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream body");
        const decoder = new TextDecoder();
        let streamedText = "";
        // Add empty assistant message to fill
        setMessages([...newMsgs, { role: "assistant", content: "" }]);
        setIsLoading(false);
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          streamedText += decoder.decode(value, { stream: true });
          setMessages([...newMsgs, { role: "assistant", content: streamedText }]);
        }
        // Explicitly save final messages to backend after streaming completes
        const finalMsgs = [...newMsgs, { role: "assistant" as const, content: streamedText }];
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (userEmail && activeSessionId && isUUID.test(activeSessionId)) {
          const unsavedMsgs = finalMsgs.slice(lastSavedMsgCount.current);
          lastSavedMsgCount.current = finalMsgs.length;
          if (unsavedMsgs.length > 0) {
            fetch(`/api/builder-sessions/${activeSessionId}/messages`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: unsavedMsgs.map(m => ({ role: m.role, content: m.content })) }),
            }).catch(e => console.warn("Failed to save streamed messages:", e));
          }
        }
        return;
      }

      // ── JSON response (create/update commands) ──
      const data = await res.json();
      if (data.error) { setMessages([...newMsgs, { role: "assistant", content: `Error: ${data.error}` }]); return; }
      if (data.parsed?.ready === true && data.parsed?.config) {
        setMessages([...newMsgs, { role: "assistant", content: data.reply || `✅ Creating your "${data.parsed.config.name}" chatbot...` }]);
        setIsLoading(false);
        await createChatbot(data.parsed.config);
      } else if (data.parsed?.update === true && data.parsed?.changes && createdBot) {
        setMessages([...newMsgs, { role: "assistant", content: "⏳ Updating your chatbot..." }]);
        setIsLoading(false);
        await updateChatbot(createdBot.id, data.parsed.changes);
      } else {
        setMessages([...newMsgs, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages([...newMsgs, { role: "assistant", content: "Network error. Please try again." }]);
    } finally { setIsLoading(false); }
  };

  const handleSend = () => { if (!input.trim()) return; sendMessage(); };

  // ── Knowledge file upload handler ──
  const handleKnowledgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingFiles(true);
    setShowAttachMenu(false);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      const res = await fetch('/api/knowledge/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.files) {
        setKnowledgeFiles(prev => [...prev, ...data.files.map((f: any) => ({ name: f.name, content: f.content, size: f.size }))]);
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploadingFiles(false);
      if (knowledgeInputRef.current) knowledgeInputRef.current.value = '';
    }
  };

  const removeKnowledgeFile = (index: number) => {
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChip = (text: string) => {
    setInput(text);
    setTimeout(() => sendMessage(text), 50);
  };

  const resetChat = async () => {
    // Create new session on backend if logged in
    let newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (userEmail) {
      try {
        const res = await fetch("/api/builder-sessions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_email: userEmail, title: "New Chat" }),
        });
        if (res.ok) {
          const data = await res.json();
          newId = data.session?.id || newId;
        }
      } catch {}
    }
    const fresh: BuilderSession = { id: newId, title: "New Chat", messages: [], createdBot: null, createdAtIndex: null, updatedAt: new Date().toISOString() };
    setSessions(prev => { const next = [fresh, ...prev].slice(0, 20); saveLocalSessions(next); return next; });
    setActiveSessionId(fresh.id);
    setMessages([]); setCreatedBot(null); setCreatedAtIndex(null); setInput("");
    lastSavedMsgCount.current = 0;
    localStorage.setItem(ACTIVE_KEY, fresh.id);
    setShowRecentChats(false);
  };

  // ── Voice Streaming (16kHz AudioWorklet → GPU VAD + STT) ──
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const voiceWsRef = useRef<WebSocket | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      audioStreamRef.current = stream;

      // 16kHz native — no resampling needed on GPU
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      console.log(`[Voice] AudioContext sample rate: ${ctx.sampleRate}Hz`);

      // Load AudioWorklet processor
      await ctx.audioWorklet.addModule('/pcm-processor.js');

      // Open WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_WS_URL || `${wsProtocol}://${window.location.host}`;
      const apiKey = process.env.NEXT_PUBLIC_ORCHESTRATOR_API_KEY || "test-key-1";
      const ws = new WebSocket(`${wsUrl}/ws/voice?api_key=${apiKey}`);
      voiceWsRef.current = ws;

      let transcription = "";
      let fullResponse = "";
      const audioQueue: Blob[] = [];
      const sentenceQueue: string[] = [];
      const audioMetaQueue: { duration_ms: number; word_count: number }[] = [];
      let displayedText = "";
      let isPlayingAudio = false;
      let currentAudio: HTMLAudioElement | null = null;
      let streamingMsgAdded = false;
      let typingInterval: ReturnType<typeof setInterval> | null = null;

      // Barge-in: stop all audio and cancel pipeline
      const stopAllAudio = () => {
        if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = "";
          currentAudio = null;
        }
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

        // Word-by-word typing animation
        if (sentence) {
          const words = sentence.split(' ');
          let wordIndex = 0;
          const baseText = displayedText;
          const prefix = baseText ? '\n' : '';
          // Use real audio duration if available, otherwise estimate
          const meta = audioMetaQueue.shift();
          const intervalMs = meta
            ? Math.max(50, (meta.duration_ms * 0.7) / meta.word_count)
            : Math.max(60, Math.min(120, 2000 / words.length));

          setIsVoiceTyping(true);

          // Add bubble immediately if not yet added
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
              // Typing complete for this sentence
              clearInterval(typingInterval!);
              typingInterval = null;
              displayedText = baseText + prefix + sentence;
              setIsVoiceTyping(false);
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
          // Wait for typing to finish before playing next
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

      ws.onopen = async () => {
        console.log("[Voice] WS connected, streaming 16kHz PCM via AudioWorklet...");
        // Fetch live landing prompt from admin config
        let landingPrompt = "";
        try {
          const promptRes = await fetch("/api/admin-prompt");
          if (promptRes.ok) {
            const promptData = await promptRes.json();
            landingPrompt = promptData.prompt;
          }
        } catch {}
        if (!landingPrompt) {
          landingPrompt = `You are Agent Forja AI, a chatbot builder assistant powered by a self-hosted LLM. You are NOT ChatGPT, NOT Claude, NOT Anthropic, NOT OpenAI. You are Agent Forja's own AI assistant. If asked what model you are, say "I'm Agent Forja AI, a self-hosted assistant." Help users create and manage their chatbots.

LANGUAGE RULE:
- ALWAYS reply in English, no matter what language the user speaks.

VOICE INPUT RULES:
- The user is speaking via voice, so their words are transcribed by speech-to-text.
- Transcriptions may contain mispronunciations, wrong words, or unclear phrases.
- If something sounds unclear or misspelled, politely ask the user to repeat or confirm. For example: "I heard 'restrow', did you mean 'restaurant'?"
- Never guess silently — always confirm if unsure.

IMPORTANT: Your responses will be SPOKEN BACK to the user via text-to-speech. Follow these voice rules:
- Keep responses concise, 2-3 sentences max, since they will be read aloud.
- Use simple, conversational language. No markdown formatting, no bullet points, no emojis, no asterisks.
- Use punctuation like periods and commas frequently so audio can start playing early.
- Never output raw JSON to the user. Always respond with natural spoken text.
- Be warm, friendly, and helpful.

YOUR APPROACH:
1. Ask at least 2-3 questions first to understand the user's needs.
2. Gather information about their business, target audience, and specific requirements.
3. Only create the chatbot after you have enough details.

QUESTIONS TO ASK:
- What is the name of your business or brand?
- What specific tasks should the chatbot handle?
- Who are your main customers?
- Do you have a website to import content from?
- Any specific tone preference? Friendly, professional, or casual?
- Which UI theme suits your brand? Options are default, modern, restaurant, ecommerce, realestate, saas, healthcare, or instagram.

WHEN TO CREATE:
Only create the chatbot when the user has answered at least 2 questions, or explicitly says to create it now.

CREATE OUTPUT FORMAT:
When you have enough information to create a new bot, respond with ONLY this JSON and no other text:
{"ready":true,"config":{"name":"Bot Name","greeting":"Welcome message","directive":"Detailed system prompt","starterQuestions":["Q1","Q2","Q3"],"theme":"modern","brandColor":"#hexcode","websiteToScrape":null,"slug":"bot-slug"},"userMessage":"Friendly message describing what you created"}

UPDATE OUTPUT FORMAT:
When user asks to change or update an existing chatbot, respond with ONLY this JSON and no other text:
{"update":true,"changes":{"field":"new value"},"userMessage":"Friendly message describing what you changed"}

CRITICAL RULES:
- For CREATE or UPDATE, respond with ONLY JSON. No text before or after.
- For questions or conversation, respond with plain spoken text only. No JSON.
- Do NOT mix JSON and text in the same response.
- NEVER ask for confirmation before making changes. When the user asks to change something, IMMEDIATELY output the update JSON. Do NOT say "Would you like to proceed?" or "Shall I go ahead?" — just do it right away.
- Always reply in English only.`;
        }
        // Send config with 16kHz sample rate
        ws.send(JSON.stringify({
          type: "config",
          mode: "stream",
          sample_rate: 16000,
          chatbot_id: createdBotRef.current?.id || null,
          system_prompt: landingPrompt,
          history: messages.slice(-20).map(m => ({
            role: m.role,
            content: m.content.replace(/^🎤\s*/, ""),
          })),
        }));

        // Connect AudioWorklet → streams 512-sample int16 chunks
        const source = ctx.createMediaStreamSource(stream);
        const workletNode = new AudioWorkletNode(ctx, 'pcm-processor');
        workletNodeRef.current = workletNode;

        workletNode.port.onmessage = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
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
            transcription = data.text;
            console.log(`[Voice] Transcription: "${transcription}" (${data.latency_ms}ms)`);
            setMessages(prev => [...prev, { role: "user", content: `🎤 ${transcription}` }]);

          } else if (data.type === "llm_token") {
            // Ignore — we use llm_sentence for display synced with audio

          } else if (data.type === "audio_meta") {
            // Store audio duration for typing speed calculation
            audioMetaQueue.push({ duration_ms: data.duration_ms, word_count: data.word_count });

          } else if (data.type === "llm_sentence") {
            // Queue sentence — text will appear when its audio starts playing
            sentenceQueue.push(data.text);
            console.log(`[Voice] Sentence queued: "${data.text}"`);

          } else if (data.type === "done") {
            fullResponse = data.full_response || "";
            const products = data.products || [];
            console.log(`[Voice] Done: ${data.total_pipeline_ms}ms, first audio: ${data.first_audio_ms}ms`);
            console.log("[Voice] Full response:", fullResponse.substring(0, 200));
            if (products.length > 0) console.log(`[Voice] Products found: ${products.length}`);

            // Check if LLM returned JSON for bot creation/update
            let handled = false;
            try {
              const trimmed = fullResponse.trim();
              let parsed = null;
              try {
                parsed = JSON.parse(trimmed);
              } catch {
                const jsonStart = trimmed.indexOf('{');
                const jsonEnd = trimmed.lastIndexOf('}');
                if (jsonStart >= 0 && jsonEnd > jsonStart) {
                  try { parsed = JSON.parse(trimmed.substring(jsonStart, jsonEnd + 1)); } catch {}
                }
              }
              if (parsed) {
                if (parsed.ready === true && parsed.config) {
                  const userMsg = parsed.userMessage || `Creating your "${parsed.config.name}" chatbot...`;
                  setMessages(prev => [...prev, { role: "assistant", content: `✅ ${userMsg}` }]);
                  createChatbot(parsed.config);
                  handled = true;
                  console.log("[Voice] Bot creation triggered!");
                } else if (parsed.update === true && parsed.changes && createdBotRef.current) {
                  const userMsg = parsed.userMessage || "Updating your chatbot...";
                  setMessages(prev => [...prev, { role: "assistant", content: `⏳ ${userMsg}` }]);
                  updateChatbot(createdBotRef.current.id, parsed.changes);
                  handled = true;
                  console.log("[Voice] Bot update triggered!");
                }
              }
            } catch (jsonErr) {
              console.log("[Voice] Response is not JSON, treating as text");
            }

            // If audio hasn't shown text yet, show full response now
            if (!handled && !streamingMsgAdded) {
              // Build response with product cards if products were found
              let displayContent = fullResponse;
              if (products.length > 0) {
                const productCards = products.map((p: any) => 
                  `\n\n📦 **${p.name}**${p.price ? `\n💰 ${p.currency || '$'}${p.price}` : ''}${p.rating ? `\n⭐ ${p.rating}/5` : ''}${p.stock_status === 'in_stock' ? '\n✅ In Stock' : ''}${p.image_url ? `\n🖼️ ![${p.name}](${p.image_url})` : ''}${p.url ? `\n🔗 [View Product](${p.url})` : ''}`
                ).join('\n');
                displayContent = fullResponse + '\n' + productCards;
              }
              setMessages(prev => [...prev, { role: "assistant", content: displayContent }]);
              streamingMsgAdded = true;
            }

            // Reset for next utterance (but DON'T clear sentenceQueue/displayedText — audio may still be playing)
            transcription = "";
            fullResponse = "";
            setIsProcessingVoice(false);
            setIsLoading(false);
          } else if (data.type === "vad_speech_start") {
            console.log("[Voice] GPU detected speech start");
            // Barge-in: stop any playing audio immediately
            stopAllAudio();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "cancel" }));
            }
            // Reset state for new utterance
            transcription = "";
            fullResponse = "";
            displayedText = "";
            streamingMsgAdded = false;
            setIsProcessingVoice(true);
            setIsLoading(true);
          } else if (data.type === "vad_speech_end") {
            console.log("[Voice] GPU detected speech end, processing...");
          }
        } catch (e) {
          console.warn("[Voice] Parse error:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("[Voice] WS Error:", e);
        setIsProcessingVoice(false);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log("[Voice] WS Closed");
        setIsProcessingVoice(false);
        setIsLoading(false);
      };

      setIsRecording(true);
    } catch (e: any) {
      console.error("Mic error:", e);
      if (e.name === "NotFoundError") {
        alert("No microphone found. Please connect a microphone and try again.");
      } else if (e.name === "NotAllowedError") {
        alert("Microphone access denied. Please allow microphone access in your browser settings.");
      } else {
        alert("Could not access microphone: " + e.message);
      }
    }
  }, [messages]);

  const stopRecording = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    // Send stop signal and close WebSocket
    if (voiceWsRef.current && voiceWsRef.current.readyState === WebSocket.OPEN) {
      voiceWsRef.current.send(JSON.stringify({ type: "stop" }));
      voiceWsRef.current.close();
      voiceWsRef.current = null;
    }
    setIsRecording(false);
    console.log("[Voice] Stopped");
  }, []);

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ══════════════════════════════════════════════════════════
  // JSX — exact same structure as new/botbuilder/page.tsx
  // with chat area added when inChat is true
  // ══════════════════════════════════════════════════════════
  // ── Lightweight markdown for code blocks, bold, and links ──
  const renderContent = (text: string) => {
    // Split on fenced code blocks
    const parts = text.split(/(```[\s\S]*?```)/);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/\n?```$/, '');
        return (
          <div key={i} style={{ position: 'relative', margin: '8px 0' }}>
            <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', overflowX: 'auto', color: '#4ade80', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{code}</pre>
            <button
              onClick={() => { navigator.clipboard.writeText(code); }}
              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#a1a1aa', cursor: 'pointer' }}
            >Copy</button>
          </div>
        );
      }
      // Inline: bold **text** and links [text](url)
      const inlineParts = part.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
      return <span key={i}>{inlineParts.map((ip, j) => {
        if (ip.startsWith('**') && ip.endsWith('**')) return <strong key={j}>{ip.slice(2, -2)}</strong>;
        const linkMatch = ip.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) return <a key={j} href={linkMatch[2]} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>{linkMatch[1]}</a>;
        return <span key={j}>{ip}</span>;
      })}</span>;
    });
  };

  return (
    <div className="botforge-landing">
      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="nav-logo" onClick={(e) => { e.preventDefault(); resetChat(); }}>
          <div className="nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          Agent Forja
        </a>

        <div className="nav-links">
          <div style={{ position: "relative" }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setShowSolutions(!showSolutions); }}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              Solutions
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: showSolutions ? "rotate(180deg)" : "rotate(0)" }}><path d="M6 9l6 6 6-6" /></svg>
            </a>
            {showSolutions && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowSolutions(false)} />
                <div className="solutions-dropdown">
                  <div className="solutions-dropdown-header">
                    <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Digital Employees</span>
                  </div>
                  {[
                    { icon: "💬", title: "AI Customer Support", desc: "24/7 automated chat support for your website visitors", color: "#3b82f6" },
                    { icon: "📈", title: "AI Sales Agent", desc: "Convert visitors into customers with smart conversations", color: "#10b981" },
                    { icon: "🎯", title: "AI Lead Capture", desc: "Qualify & capture leads automatically from every channel", color: "#f59e0b" },
                    { icon: "🎙️", title: "AI Voice Agent", desc: "Voice-powered assistant for calls and real-time support", color: "#8b5cf6" },
                    { icon: "📱", title: "AI Social Media Agent", desc: "Automate DMs, comments & engagement on social platforms", color: "#ec4899" },
                  ].map((item) => (
                    <a
                      key={item.title}
                      href="#"
                      className="solutions-dropdown-item"
                      onClick={(e) => { e.preventDefault(); setShowSolutions(false); }}
                    >
                      <div className="solutions-dropdown-icon" style={{ background: `${item.color}20`, color: item.color }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "13.5px", color: "#fff" }}>{item.title}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px", lineHeight: 1.3 }}>{item.desc}</div>
                      </div>
                    </a>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "6px", paddingTop: "8px", padding: "8px 12px" }}>
                    <a href="/solutions" style={{ fontSize: "12.5px", color: "#3b82f6", textDecoration: "none", fontWeight: 500 }} onClick={() => setShowSolutions(false)}>View all solutions →</a>
                  </div>
                </div>
              </>
            )}
          </div>
          <a href="#">Resources</a>
          <a href="#">Enterprise</a>
          <a href="/pricing">Pricing</a>
        </div>

        <div className="nav-right">
          {/* Recent Chats dropdown */}
          {sessions.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                className="btn-login"
                onClick={() => setShowRecentChats(!showRecentChats)}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                💬 Recent Chats
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {showRecentChats && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowRecentChats(false)} />
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
                    width: 280, maxHeight: 360, overflowY: "auto",
                    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", padding: "6px",
                  }}>
                    <div style={{ padding: "8px 10px 6px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Sessions</div>
                    {sessions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => switchSession(s.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                          background: s.id === activeSessionId ? "rgba(99,102,241,0.15)" : "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (s.id !== activeSessionId) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={e => { if (s.id !== activeSessionId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: 16 }}>{s.createdBot ? "🤖" : "💬"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: s.id === activeSessionId ? "#818cf8" : "#ddd", fontWeight: s.id === activeSessionId ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: "#666" }}>{relTime(s.updatedAt)}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                          style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, borderRadius: 4, fontSize: 11, opacity: 0.5, transition: "opacity 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                          title="Delete"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {inChat && (
            <button className="btn-login" onClick={resetChat}>✨ New Agent</button>
          )}
          {authStatus === "authenticated" && session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <a href="/admin/agents" className="btn-login" style={{ fontSize: "13px" }}>My Agents</a>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "9999px", padding: "4px 14px 4px 4px", cursor: "pointer",
                    color: "#fff", transition: "all 0.2s", fontSize: 13, fontWeight: 500,
                  }}
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      style={{ width: 28, height: 28, borderRadius: "9999px", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: "9999px",
                      background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "#fff",
                    }}>
                      {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  {(session.user.name || session.user.email || "User").split(" ")[0]}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </button>

                {/* Account dropdown */}
                {showAccountMenu && (
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowAccountMenu(false)} />
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
                      width: 300, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden",
                    }}>
                      {/* Profile header */}
                      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {session.user.image ? (
                            <img src={session.user.image} alt="" style={{ width: 44, height: 44, borderRadius: "9999px", objectFit: "cover" }} />
                          ) : (
                            <div style={{
                              width: 44, height: 44, borderRadius: "9999px",
                              background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 18, fontWeight: 700, color: "#fff",
                            }}>
                              {(session.user.name || session.user.email || "U")[0].toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {session.user.name || "User"}
                            </div>
                            <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {session.user.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plan badge */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Current Plan</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                fontSize: 14, fontWeight: 600, color: "#fff",
                                background: (session.user as any).plan === "free" ? "rgba(255,255,255,0.08)" :
                                  (session.user as any).plan?.startsWith("ltd_") ? "linear-gradient(135deg, #F59E0B, #EF4444)" :
                                  "linear-gradient(135deg, #8B5CF6, #6366F1)",
                                padding: "3px 10px", borderRadius: 6,
                              }}>
                                {((session.user as any).plan || "free").replace("ltd_", "LTD ").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                            </div>
                          </div>
                          <a href="/pricing" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 500 }}>
                            Upgrade →
                          </a>
                        </div>
                      </div>

                      {/* Credits */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Credits Balance</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "#4ade80" }}>
                            {(session.user as any).credit_balance ?? 0}
                          </span>
                          <span style={{ fontSize: 12, color: "#666" }}>credits remaining</span>
                        </div>
                      </div>

                      {/* Quick links */}
                      <div style={{ padding: "6px" }}>
                        {[
                          { label: "My Agents", icon: "🤖", href: "/admin/agents" },
                          { label: "Billing & Plans", icon: "💳", href: "/admin/billing" },
                          { label: "Admin Dashboard", icon: "📊", href: "/admin/conversations" },
                        ].map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                              color: "#ccc", fontSize: 13, fontWeight: 500,
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            {item.label}
                          </a>
                        ))}

                        {/* Sign out */}
                        <button
                          onClick={() => {
                            import("next-auth/react").then(m => m.signOut());
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, width: "100%",
                            padding: "10px 12px", borderRadius: 10, border: "none",
                            background: "transparent", color: "#ef4444", fontSize: 13,
                            fontWeight: 500, cursor: "pointer", transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: 16 }}>🚪</span>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <button className="btn-login" onClick={() => window.location.href = '/login'}>Log in</button>
              <button className="btn-start" onClick={() => window.location.href = '/login'}>Get started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero — only on landing */}
      {!inChat && (
        <div className="hero">
          <h1>Build something amazing</h1>
          <p>{typedSubtitle}<span className="typing-cursor">|</span></p>
        </div>
      )}

      {/* ══ CHAT MODE: before bot created — full width ══ */}
      {inChat && !createdBot && (
        <>
          <div className="chat-area">
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-row ${msg.role === "user" ? "chat-row-user" : "chat-row-assistant"}`}>
                  <div className={`${msg.role === "user" ? "bubble-user" : "bubble-assistant"}${msg.role === "assistant" && i === messages.length - 1 && isVoiceTyping ? " voice-typing" : ""}`}>{msg.role === "assistant" ? renderContent(msg.content) : msg.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-row chat-row-assistant">
                  <div className="bubble-assistant loading-bubble">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="prompt-container prompt-bottom">
            <div className="prompt-box">
              <textarea
                ref={textareaRef}
                className="prompt-textarea"
                placeholder="Ask Agent Forja to create an agent for my..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={3}
                disabled={isLoading || isCreating}
              />
              {/* Uploaded files chips */}
              {knowledgeFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {knowledgeFiles.map((f, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#a1a1aa' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      {f.name}
                      <button onClick={() => removeKnowledgeFile(i)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0', lineHeight: '1' }}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="prompt-toolbar">
                <div className="prompt-left">
                  <input ref={knowledgeInputRef} type="file" multiple accept=".pdf,.txt,.csv,.md,.json,.jsonl,.docx" style={{ display: 'none' }} onChange={handleKnowledgeUpload} />
                  <button className="toolbar-btn" title="Add knowledge source" onClick={() => knowledgeInputRef.current?.click()} disabled={isUploadingFiles} style={isUploadingFiles ? { opacity: 0.5 } : {}}>
                    {isUploadingFiles ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="prompt-right">
                  <button className="plan-btn">Plan</button>
                  <button
                    className={`toolbar-btn ${isRecording ? "recording" : ""}`}
                    title={isRecording ? "Click to stop recording" : isProcessingVoice ? "Processing..." : "Click to start voice input"}
                    onClick={toggleRecording}
                    disabled={isProcessingVoice || isLoading}
                    style={{
                      ...(isRecording
                        ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1.5px solid #22c55e", borderRadius: "8px", padding: "6px 8px", animation: "pulse 1s infinite" }
                        : isProcessingVoice
                        ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1.5px solid #f59e0b", borderRadius: "8px", padding: "6px 8px" }
                        : { background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "8px", padding: "6px 8px" })
                    }}
                  >
                    {isProcessingVoice ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                      </svg>
                    ) : isRecording ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <rect x="9" y="1" width="6" height="12" rx="3" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </button>
                  <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isLoading || isCreating}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ SPLIT MODE: after bot created — left chat + right preview ══ */}
      {inChat && createdBot && (
        <div className="split-layout">
          {/* Left: chat + prompt */}
          <div className="split-left">
            <div className="chat-area">
              <div className="chat-messages">
                {messages.slice(0, createdAtIndex !== null ? createdAtIndex + 1 : messages.length).map((msg, i) => (
                  <div key={i} className={`chat-row ${msg.role === "user" ? "chat-row-user" : "chat-row-assistant"}`}>
                    <div className={msg.role === "user" ? "bubble-user" : "bubble-assistant"}>{msg.role === "assistant" ? renderContent(msg.content) : msg.content}</div>
                  </div>
                ))}

                {/* Success inline message */}
                {createdAtIndex !== null && (
                  <div className="chat-row chat-row-assistant">
                    <div className="bubble-assistant">🎉 <strong>{createdBot.name}</strong> is live! You can see the preview on the right. Tell me if you want any changes!</div>
                  </div>
                )}

                {/* Scrape progress UI */}
                {scrapeJobId && (
                  <div className="chat-row chat-row-assistant">
                    <ScrapeProgress jobId={scrapeJobId} onComplete={() => setScrapeJobId(null)} />
                  </div>
                )}

                {/* Post-creation messages */}
                {createdAtIndex !== null && messages.slice(createdAtIndex + 1).map((msg, i) => (
                  <div key={`post-${i}`} className={`chat-row ${msg.role === "user" ? "chat-row-user" : "chat-row-assistant"}`}>
                    <div className={msg.role === "user" ? "bubble-user" : "bubble-assistant"}>{msg.role === "assistant" ? renderContent(msg.content) : msg.content}</div>
                  </div>
                ))}

                {isLoading && (
                  <div className="chat-row chat-row-assistant">
                    <div className="bubble-assistant loading-bubble">
                      <span className="dot" /><span className="dot" /><span className="dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="prompt-container prompt-bottom">
              <div className="prompt-box">
                <textarea
                  ref={textareaRef}
                  className="prompt-textarea"
                  placeholder="Ask me to make changes..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={2}
                  disabled={isLoading || isCreating}
                />
                <div className="prompt-toolbar">
                  <div className="prompt-left">
                    <button className="toolbar-btn" title="Attach file">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div className="prompt-right">
                    <button className="plan-btn">Plan</button>
                    <button
                      className={`toolbar-btn ${isRecording ? "recording" : ""}`}
                      title={isRecording ? "Click to stop recording" : isProcessingVoice ? "Processing..." : "Click to start voice input"}
                      onClick={toggleRecording}
                      disabled={isProcessingVoice || isLoading}
                      style={{
                        ...(isRecording
                          ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1.5px solid #22c55e", borderRadius: "8px", padding: "6px 8px", animation: "pulse 1s infinite" }
                          : isProcessingVoice
                          ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1.5px solid #f59e0b", borderRadius: "8px", padding: "6px 8px" }
                          : { background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "8px", padding: "6px 8px" })
                      }}
                    >
                      {isProcessingVoice ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                      ) : isRecording ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <rect x="9" y="1" width="6" height="12" rx="3" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      )}
                    </button>
                    <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isLoading || isCreating}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: scroll control */}
          <div className="scroll-divider">
            <button className="scroll-btn" onClick={() => {
              const chatArea = document.querySelector('.split-left .chat-area');
              if (chatArea) chatArea.scrollBy({ top: -200, behavior: 'smooth' });
            }} title="Scroll up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <div className="scroll-track" />
            <button className="scroll-btn" onClick={() => {
              const chatArea = document.querySelector('.split-left .chat-area');
              if (chatArea) chatArea.scrollBy({ top: 200, behavior: 'smooth' });
            }} title="Scroll down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Right: live preview in a card */}
          <div className="split-right">
            <div className="preview-card">
              <div className="preview-header">
                <div className="preview-dot" />
                <span className="preview-title">{createdBot.name}</span>
                <div className="preview-actions">
                  <button className="preview-refresh" onClick={() => setIframeKey((k) => k + 1)} title="Refresh preview">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                  <a href={`/c/${createdBot.slug}`} target="_blank" className="preview-open" title="Open in new tab">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>
              <iframe
                key={iframeKey}
                className="preview-iframe"
                src={`/c/${createdBot.slug}`}
                title="Live chatbot preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Prompt Box — only on landing */}
      {!inChat && (
        <div className="prompt-container">
          <div className="prompt-box">
            <textarea
              ref={textareaRef}
              className="prompt-textarea"
              placeholder="Ask Agent Forja to create an agent for my..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows={3}
              disabled={isLoading || isCreating}
            />
            {/* Uploaded files chips */}
            {knowledgeFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {knowledgeFiles.map((f, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', color: '#a1a1aa' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    {f.name}
                    <button onClick={() => removeKnowledgeFile(i)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '0', lineHeight: '1' }}>✕</button>
                  </span>
                ))}
              </div>
            )}
            <div className="prompt-toolbar">
              <div className="prompt-left">
                <input ref={knowledgeInputRef} type="file" multiple accept=".pdf,.txt,.csv,.md,.json,.jsonl,.docx" style={{ display: 'none' }} onChange={handleKnowledgeUpload} />
                <button className="toolbar-btn" title="Add knowledge source" onClick={() => knowledgeInputRef.current?.click()} disabled={isUploadingFiles} style={isUploadingFiles ? { opacity: 0.5 } : {}}>
                  {isUploadingFiles ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" opacity="0.3" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="prompt-right">
                <button className="plan-btn">Plan</button>
                <button
                  className={`toolbar-btn ${isRecording ? "recording" : ""}`}
                  title={isRecording ? "Click to stop recording" : isProcessingVoice ? "Processing..." : "Click to start voice input"}
                  onClick={toggleRecording}
                  disabled={isProcessingVoice || isLoading}
                  style={{
                    ...(isRecording
                      ? { background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1.5px solid #22c55e", borderRadius: "8px", padding: "6px 8px", animation: "pulse 1s infinite" }
                      : isProcessingVoice
                      ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1.5px solid #f59e0b", borderRadius: "8px", padding: "6px 8px" }
                      : { background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: "8px", padding: "6px 8px" })
                  }}
                >
                  {isProcessingVoice ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  ) : isRecording ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <rect x="9" y="1" width="6" height="12" rx="3" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
                <button className="send-btn" onClick={handleSend} disabled={!input.trim() || isLoading || isCreating}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Chips — only on landing */}
      {!inChat && (
        <div className="suggestions">
          <button className="chip" onClick={() => handleChip("Create a customer support agent for my e-commerce store")}>
            🛒 E-commerce support agent
          </button>
          <button className="chip" onClick={() => handleChip("Build a reservation booking agent for my restaurant")}>
            🍽️ Restaurant booking agent
          </button>
          <button className="chip" onClick={() => handleChip("Create a lead generation agent for my SaaS product")}>
            🎯 Lead gen agent
          </button>
          <button className="chip" onClick={() => handleChip("Build a voice-enabled FAQ agent from my website")}>
            🎙️ Voice FAQ agent
          </button>
        </div>
      )}
    </div>
  );
}
