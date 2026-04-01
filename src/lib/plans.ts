/**
 * Plan Definitions & Enforcement Helpers
 * =======================================
 * Central source of truth for all BotForge plans.
 */

// ---------------------------------------------------------------------------
// Plan IDs
// ---------------------------------------------------------------------------
export type PlanId =
  | "free"
  | "starter"
  | "pro"
  | "enterprise"
  | "ltd_starter"
  | "ltd_reseller_pro"
  | "ltd_agency_elite";

// ---------------------------------------------------------------------------
// Plan definition type
// ---------------------------------------------------------------------------
export interface PlanDefinition {
  id: PlanId;
  name: string;
  category: "free" | "monthly" | "lifetime";
  priceCents: number;           // 0 for free / enterprise
  messageLimit: number;         // monthly cap (0 = unlimited)
  chatbotLimit: number;         // max bots (0 = unlimited)
  voiceIncluded: boolean;       // voice bot included in plan?
  features: string[];
}

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------
export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    category: "free",
    priceCents: 0,
    messageLimit: 50,
    chatbotLimit: 1,
    voiceIncluded: false,
    features: ["1 chatbot", "50 messages/month", "Embed widget"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    category: "monthly",
    priceCents: 4900,
    messageLimit: 5000,
    chatbotLimit: 5,
    voiceIncluded: false,
    features: ["5 chatbots", "5,000 messages/month", "Embed widget", "Lead capture", "Email support"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    category: "monthly",
    priceCents: 14900,
    messageLimit: 20000,
    chatbotLimit: 0, // unlimited
    voiceIncluded: true,
    features: ["Unlimited chatbots", "20,000 messages/month", "Voice bot", "Instagram", "Advanced lead capture", "Priority support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    category: "monthly",
    priceCents: 0, // custom
    messageLimit: 0, // unlimited
    chatbotLimit: 0, // unlimited
    voiceIncluded: true,
    features: ["Unlimited everything", "Custom voice", "SLA guarantee", "Dedicated support"],
  },
  ltd_starter: {
    id: "ltd_starter",
    name: "LTD Starter",
    category: "lifetime",
    priceCents: 9900,
    messageLimit: 2000,
    chatbotLimit: 3,
    voiceIncluded: false,
    features: ["3 chatbots", "2,000 messages/month", "White-label", "7 themes", "Embed widget", "Lead capture"],
  },
  ltd_reseller_pro: {
    id: "ltd_reseller_pro",
    name: "LTD Reseller Pro",
    category: "lifetime",
    priceCents: 19900,
    messageLimit: 5000,
    chatbotLimit: 15,
    voiceIncluded: false,
    features: ["15 chatbots", "5,000 messages/month", "Instagram", "Smarter AI", "Priority support"],
  },
  ltd_agency_elite: {
    id: "ltd_agency_elite",
    name: "LTD Agency Elite",
    category: "lifetime",
    priceCents: 39900,
    messageLimit: 15000,
    chatbotLimit: 30,
    voiceIncluded: true,
    features: ["30 chatbots", "15,000 messages/month", "Voice bot", "Bring own API key", "Dedicated support"],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPlan(planId: string): PlanDefinition {
  return PLANS[planId as PlanId] || PLANS.free;
}

export function getPlanLimits(planId: string) {
  const plan = getPlan(planId);
  return {
    messageLimit: plan.messageLimit,
    chatbotLimit: plan.chatbotLimit,
    voiceIncluded: plan.voiceIncluded,
  };
}

/** Check if the plan allows creating another chatbot */
export function isUnderChatbotLimit(planId: string, currentCount: number): boolean {
  const { chatbotLimit } = getPlanLimits(planId);
  if (chatbotLimit === 0) return true; // unlimited
  return currentCount < chatbotLimit;
}

/** Check if the plan allows sending another message */
export function isUnderMessageLimit(planId: string, currentCount: number): boolean {
  const { messageLimit } = getPlanLimits(planId);
  if (messageLimit === 0) return true; // unlimited
  return currentCount < messageLimit;
}

/** Check if voice bot is available for this plan */
export function hasVoiceAccess(planId: string, hasVoiceAddon = false): boolean {
  if (hasVoiceAddon) return true;
  return getPlan(planId).voiceIncluded;
}

/** Get current period string (e.g., "2026-04") */
export function getCurrentPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Format remaining as percentage */
export function usagePercent(used: number, limit: number): number {
  if (limit === 0) return 0; // unlimited
  return Math.min(100, Math.round((used / limit) * 100));
}
