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

// Force SSR so theme changes reflect immediately and avoid caching the branch
export const dynamic = "force-dynamic";

// Next.js 15: dynamic route params are async. Await before using.
export default async function PublicBotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  return (
    <div className="fixed inset-0 w-screen h-screen text-white overflow-hidden">
      {/* Premium gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0b0b0f] via-[#0a0a12] to-[#0a0a0a]" />
      {/* Subtle radial glows for depth */}
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_60%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(40%_40%_at_15%_20%,rgba(236,72,153,0.10),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(35%_35%_at_85%_75%,rgba(168,85,247,0.12),transparent)]" />
      <ErrorBoundary fallback={<div className="p-4 text-red-500">Something went wrong while rendering the chat.</div>}>
        {(() => {
          const theme = String(((bot as any).theme_template ?? (bot as any).theme ?? "default")).toLowerCase();

          // Instagram theme
          if (theme === "instagram") {
            return (
              <InstagramChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#E1306C"}
                greeting={bot.greeting ?? "Hey! 👋 Thanks for reaching out."}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Instagram Automation"}
                placeholder={(bot as any).placeholder}
              />
            );
          }

          // Restaurant theme
          if (theme === "restaurant") {
            return (
              <RestaurantChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#F97316"}
                greeting={bot.greeting ?? "Welcome! How can I help you today?"}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Your restaurant assistant"}
              />
            );
          }

          // E-commerce theme
          if (theme === "ecommerce") {
            return (
              <EcommerceChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#6366F1"}
                greeting={bot.greeting ?? "Welcome! How can I help you today?"}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Your shopping assistant"}
              />
            );
          }

          // Real Estate theme
          if (theme === "realestate") {
            return (
              <RealEstateChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#D97706"}
                greeting={bot.greeting ?? "Welcome! How can I help you find your dream home?"}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Your property expert"}
              />
            );
          }

          // SaaS Onboarding theme
          if (theme === "saas") {
            return (
              <SaaSChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#6366F1"}
                greeting={bot.greeting ?? "Welcome! Let me help you get started."}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Onboarding Assistant"}
              />
            );
          }

          // Healthcare FAQ theme
          if (theme === "healthcare") {
            return (
              <HealthcareChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#14B8A6"}
                greeting={bot.greeting ?? "Hello! How can I help you with your health questions?"}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Health Information Assistant"}
              />
            );
          }

          // Modern theme
          if (theme === "modern") {
            return (
              <ModernChatUI
                slug={bot.slug}
                name={bot.name ?? "Chatbot"}
                avatarUrl={bot.avatar_url ?? null}
                brandColor={bot.brand_color ?? "#3B82F6"}
                bubbleStyle={(bot.bubble_style as any) ?? "rounded"}
                greeting={bot.greeting ?? "How can I help you today?"}
                typingIndicator={bot.typing_indicator !== false}
                starterQuestions={bot.starter_questions ?? []}
                botId={bot.id}
                tagline={(bot as any).tagline ?? "Ask your AI Teacher…"}
                model={bot.model ?? "gpt-4o-mini"}
              />
            );
          }

          // Default theme
          return (
            <ChatClient
              bot={{
                id: bot.id,
                name: bot.name ?? "Chatbot",
                slug: bot.slug,
                greeting: bot.greeting ?? "How can I help you today?",
                directive: bot.directive ?? "",
                knowledge_base: bot.knowledge_base ?? "",
                model: bot.model ?? "gpt-4o-mini",
                temperature: typeof bot.temperature === "number" ? bot.temperature : 0.6,
                typing_indicator: bot.typing_indicator !== false,
                brand_color: bot.brand_color ?? "#3B82F6",
                avatar_url: bot.avatar_url ?? null,
                bubble_style: bot.bubble_style ?? "rounded",
                starter_questions: bot.starter_questions ?? [],
                tagline: (bot as any).tagline ?? "Ask your AI Teacher…",
                rules: (bot as any).rules ?? null,
              }}
            />
          );
        })()}
      </ErrorBoundary>
    </div>
  );
}

