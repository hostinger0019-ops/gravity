"use client";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refund Policy" },
];

function LegalLayout({ title, children, active }: { title: string; children: React.ReactNode; active: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Agent Forja
          </Link>
          <nav className="flex gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${active === item.href ? "text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm mb-10">Last updated: April 3, 2026</p>
        <div className="prose prose-invert prose-slate max-w-none
          prose-headings:text-white prose-headings:font-semibold
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-li:text-slate-300
          prose-strong:text-white
          prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
        ">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Agent Forja, operated by Tarik Fashion Company. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default LegalLayout;
