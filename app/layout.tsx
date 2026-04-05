import "./globals.css";
import "katex/dist/katex.min.css"; // Math rendering styles
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Forja — Build AI Chatbots & Voicebots in Seconds",
  description: "Create powerful AI chatbots and voicebots for your business.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js" defer></script>
      </body>
    </html>
  );
}
