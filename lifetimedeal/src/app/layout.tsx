import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Forja Lifetime Deal — Build & Sell AI Chatbots | $99 One-Time",
  description:
    "Get lifetime access to the AI chatbot builder platform. White-label, resell, and earn recurring revenue from your clients. One-time $99 payment.",
  keywords: "AI chatbot, white-label chatbot, lifetime deal, chatbot builder, reseller",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
