"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

declare global {
  interface Window {
    Paddle?: any;
  }
}

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    credits: "5,000",
    description: "Perfect for small businesses getting started with AI chatbots",
    features: [
      "5,000 credits/month",
      "1 message = 1 credit",
      "1 voice minute = 10 credits",
      "Up to 5 chatbots",
      "Website embed widget",
      "Lead capture",
      "Email support",
      "Basic analytics",
    ],
    cta: "Get Started",
    popular: false,
    gradient: "from-slate-800 to-slate-900",
    border: "border-white/10",
    planId: "starter",
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    credits: "20,000",
    description: "For growing businesses that need more power and flexibility",
    features: [
      "20,000 credits/month",
      "1 message = 1 credit",
      "1 voice minute = 10 credits",
      "Unlimited chatbots",
      "Website + Instagram integration",
      "Voice bot support",
      "Advanced lead capture",
      "Priority support",
      "Custom branding",
      "API access",
    ],
    cta: "Get Started",
    popular: true,
    gradient: "from-blue-600 to-violet-600",
    border: "border-blue-500/50",
    planId: "pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    credits: "Unlimited",
    description: "For large teams with custom requirements and dedicated support",
    features: [
      "Unlimited credits",
      "Unlimited chatbots",
      "All integrations",
      "Voice bot with custom voice",
      "Dedicated account manager",
      "Custom AI training",
      "SLA guarantee",
      "White-label solution",
      "On-premise deployment",
      "24/7 phone support",
    ],
    cta: "Contact Sales",
    popular: false,
    gradient: "from-slate-800 to-slate-900",
    border: "border-white/10",
    planId: "",
  },
];

const faqs = [
  {
    q: "What is a credit?",
    a: "Credits are the currency for using Agent Forja. Each chat message (user sends + AI replies) costs 1 credit. Each minute of voice interaction costs 10 credits.",
  },
  {
    q: "Do unused credits roll over?",
    a: "Credits reset each billing cycle. Upgrade your plan if you consistently need more credits.",
  },
  {
    q: "Can I change my plan anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    q: "What happens when I run out of credits?",
    a: "Your chatbots will pause until your credits renew next month, or you can upgrade your plan for more credits.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! Every new account gets 50 free credits to try Agent Forja. No credit card required.",
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";
  const [loading, setLoading] = useState<string | null>(null);
  const [showTrust, setShowTrust] = useState(false);

  useEffect(() => {
    // Initialize Paddle.js
    const interval = setInterval(() => {
      if (window.Paddle) {
        window.Paddle.Initialize({
          token: "live_a35bedce7f295b00afc720a33e5",
          eventCallback: function (data: any) {
            if (data.name === "checkout.completed") {
              console.log("[Paddle] Payment completed!", data);
              setShowTrust(false);
              setTimeout(() => {
                window.location.href = "/admin/chatbots?upgraded=true";
              }, 2000);
            }
            if (data.name === "checkout.closed") {
              setShowTrust(false);
            }
          },
        });
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const openCheckout = async (planId: string) => {
    if (!planId) {
      window.location.href = "mailto:support@agentforja.com?subject=Enterprise Plan Inquiry";
      return;
    }

    const email = userEmail || prompt("Enter your email to continue:");
    if (!email) return;

    setLoading(planId);
    setShowTrust(true);
    try {
      // Create transaction via our API (dynamic pricing)
      const res = await fetch("/api/paddle/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email }),
      });

      const data = await res.json();
      if (!res.ok || !data.transactionId) {
        alert("Failed to create checkout. Please try again.");
        console.error("[Paddle] Transaction error:", data);
        setShowTrust(false);
        return;
      }

      // Open Paddle checkout with the transaction ID
      if (window.Paddle) {
        window.Paddle.Checkout.open({
          transactionId: data.transactionId,
          customer: { email: email },
          settings: {
            successUrl: "https://agentforja.com/admin/chatbots?upgraded=true",
          },
        });
      }
    } catch (err) {
      console.error("[Paddle] Checkout error:", err);
      alert("Something went wrong. Please try again.");
      setShowTrust(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Trust banner — shows when checkout opens */}
      {showTrust && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-3 px-4 text-sm font-medium shadow-lg animate-pulse">
          🔒 Secure checkout powered by <strong>Paddle.com</strong> · Agent Forja is a product by <strong>Tarik</strong>
        </div>
      )}
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="text-xl font-bold">Agent Forja</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Log in</Link>
          <Link href="/login" className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-16 pb-12 px-6">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-blue-400">50 free credits on signup</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          Simple, transparent
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">pricing</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Pay only for what you use. Every plan includes all features.
          <br />
          No hidden fees. Cancel anytime.
        </p>
      </div>

      {/* Credit explainer */}
      <div className="max-w-2xl mx-auto mb-12 px-6">
        <div className="flex items-center justify-center gap-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">1 credit</div>
            <div className="text-sm text-slate-400 mt-1">= 1 chat message</div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-400">10 credits</div>
            <div className="text-sm text-slate-400 mt-1">= 1 voice minute</div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border ${plan.border} bg-gradient-to-b ${plan.gradient} p-8 flex flex-col ${
                plan.popular ? "md:-mt-4 md:mb-[-16px] shadow-2xl shadow-blue-500/20" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-200">{plan.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-slate-400 text-lg">{plan.period}</span>
                <div className="text-sm text-blue-400 mt-1 font-medium">{plan.credits} credits/month</div>
              </div>

              <button
                onClick={() => openCheckout(plan.planId)}
                disabled={loading === plan.planId}
                className={`w-full py-3 rounded-xl font-medium text-center transition-all mb-8 block cursor-pointer ${
                  plan.popular
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-white/10 text-white hover:bg-white/20"
                } ${loading === plan.planId ? "opacity-50 cursor-wait" : ""}`}
              >
                {loading === plan.planId ? "Processing..." : plan.cta}
              </button>

              <div className="space-y-3 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white/5 border border-white/10 rounded-xl">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="font-medium">{faq.q}</span>
                <svg className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-5 text-sm text-slate-400 -mt-1">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to build your AI chatbot?</h2>
          <p className="text-slate-400 mb-6">Start with 50 free credits. No credit card required.</p>
          <Link href="/login" className="inline-flex bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
            Get started for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <span>© 2026 Agent Forja. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="mailto:support@tarik.business" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
