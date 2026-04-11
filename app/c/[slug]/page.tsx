import { getBotForPublic } from "@/data/runtime";
import { headers } from "next/headers";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChatClient from "./ChatClient";
import ModernChatUI from "@/components/chat/ModernChatUI";
import RestaurantChatUI from "@/components/chat/RestaurantChatUI";
import EcommerceChatUI from "@/components/chat/EcommerceChatUI";
import RealEstateChatUI from "@/components/chat/RealEstateChatUI";
import SaaSChatUI from "@/components/chat/SaaSChatUI";
import HealthcareChatUI from "@/components/chat/HealthcareChatUI";
import InstagramChatUI from "@/components/chat/InstagramChatUI";
import EmbedChatUI from "@/components/chat/EmbedChatUI";

// Force SSR so theme changes reflect immediately and avoid caching the branch
export const dynamic = "force-dynamic";

// Next.js 15: dynamic route params are async. Await before using.
export default async function PublicBotPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const isEmbed = sp?.embed === '1';
  const bot = await getBotForPublic(slug);
  // Basic mobile detection from user-agent; used only to pick UI variant.
  const ua = (await headers()).get("user-agent") || "";
  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  if (!bot) {
    return (
      <div className="relative min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a] text-white p-6 overflow-hidden">
        {/* Premium gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0b0b0f] via-[#0a0a12] to-[#0a0a0a]" />
        {/* Subtle radial glows */}
        <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_60%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(40%_40%_at_80%_20%,rgba(168,85,247,0.12),transparent)]" />
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold">Chatbot not found</h1>
          <p className="mt-2 text-sm text-gray-400">This link is invalid or the bot is not public.</p>
        </div>
      </div>
    );
  }

  // Override brand color from URL param (set by widget.js data-brand-color)
  const brandOverride = sp?.brand as string | undefined;
  if (brandOverride && bot) {
    (bot as any).brand_color = brandOverride;
  }

  // Helper to render the correct themed chat UI based on bot config
  function renderChatUI(b: NonNullable<typeof bot>) {
    const theme = String(((b as any).theme_template ?? (b as any).theme ?? "default")).toLowerCase();

    if (theme === "instagram") {
      return (
        <InstagramChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#E1306C"}
          greeting={b.greeting ?? "Hey! 👋 Thanks for reaching out."}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Instagram Automation"}
          placeholder={(b as any).placeholder}
        />
      );
    }
    if (theme === "restaurant") {
      return (
        <RestaurantChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#F97316"}
          greeting={b.greeting ?? "Welcome! How can I help you today?"}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Your restaurant assistant"}
        />
      );
    }
    if (theme === "ecommerce") {
      return (
        <EcommerceChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#6366F1"}
          greeting={b.greeting ?? "Welcome! How can I help you today?"}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Your shopping assistant"}
        />
      );
    }
    if (theme === "realestate") {
      return (
        <RealEstateChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#D97706"}
          greeting={b.greeting ?? "Welcome! How can I help you find your dream home?"}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Your property expert"}
        />
      );
    }
    if (theme === "saas") {
      return (
        <SaaSChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#6366F1"}
          greeting={b.greeting ?? "Welcome! Let me help you get started."}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Onboarding Assistant"}
        />
      );
    }
    if (theme === "healthcare") {
      return (
        <HealthcareChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#14B8A6"}
          greeting={b.greeting ?? "Hello! How can I help you with your health questions?"}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Health Information Assistant"}
        />
      );
    }
    if (theme === "modern") {
      return (
        <ModernChatUI
          slug={b.slug}
          name={b.name ?? "Chatbot"}
          avatarUrl={b.avatar_url ?? null}
          brandColor={b.brand_color ?? "#3B82F6"}
          bubbleStyle={(b.bubble_style as any) ?? "rounded"}
          greeting={b.greeting ?? "How can I help you today?"}
          typingIndicator={b.typing_indicator !== false}
          starterQuestions={b.starter_questions ?? []}
          botId={b.id}
          tagline={(b as any).tagline ?? "Ask your AI Teacher…"}
          model={b.model ?? "gpt-4o-mini"}
        />
      );
    }
    // Default theme
    return (
      <ChatClient
        bot={{
          id: b.id,
          name: b.name ?? "Chatbot",
          slug: b.slug,
          greeting: b.greeting ?? "How can I help you today?",
          directive: b.directive ?? "",
          knowledge_base: b.knowledge_base ?? "",
          model: b.model ?? "gpt-4o-mini",
          temperature: typeof b.temperature === "number" ? b.temperature : 0.6,
          typing_indicator: b.typing_indicator !== false,
          brand_color: b.brand_color ?? "#3B82F6",
          avatar_url: b.avatar_url ?? null,
          bubble_style: b.bubble_style ?? "rounded",
          starter_questions: b.starter_questions ?? [],
          tagline: (b as any).tagline ?? "Ask your AI Teacher…",
          rules: (b as any).rules ?? null,
        }}
      />
    );
  }

  // Embed mode: choose UI based on ui_type setting
  if (isEmbed) {
    // Read ui_type from URL param (set by widget.js) or from bot's saved integrations
    const uiParam = sp?.ui as string | undefined;
    const savedUiType = (bot as any)?.integrations?.embed?.ui_type;
    const uiType = uiParam || savedUiType || 'full';

    if (uiType === 'basic') {
      return (
        <div className="w-full h-[100dvh] overflow-hidden" style={{ background: '#fff' }}>
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong.</div>}>
            <EmbedChatUI
              slug={bot.slug}
              name={bot.name ?? "Chatbot"}
              greeting={bot.greeting ?? "Hi! How can I help you?"}
              brandColor={bot.brand_color || "#6366F1"}
              avatarUrl={bot.avatar_url ?? null}
              starterQuestions={bot.starter_questions ?? []}
              botId={bot.id}
              tagline={(bot as any).tagline ?? "Ask me anything..."}
            />
          </ErrorBoundary>
        </div>
      );
    }

    // Full Premium — PersistentChat with all features
    return (
      <div className="w-full h-[100dvh] bg-[#0a0a0a] overflow-hidden">
        <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong.</div>}>
          {renderChatUI(bot)}
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen text-white overflow-hidden">
      {/* Premium gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0b0b0f] via-[#0a0a12] to-[#0a0a0a]" />
      {/* Subtle radial glows for depth */}
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_60%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(40%_40%_at_15%_20%,rgba(236,72,153,0.10),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(35%_35%_at_85%_75%,rgba(168,85,247,0.12),transparent)]" />
      <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong while rendering the chat.</div>}>
        {renderChatUI(bot)}
      </ErrorBoundary>
    </div>
  );
}


