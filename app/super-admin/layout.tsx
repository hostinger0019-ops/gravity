"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "";

const NAV_ITEMS = [
  { href: "/super-admin", label: "Dashboard", icon: "📊" },
  { href: "/super-admin/users", label: "Users", icon: "👥" },
  { href: "/super-admin/agents", label: "AI Agents", icon: "🤖" },
  { href: "/super-admin/prompts", label: "Prompts", icon: "✏️" },
  { href: "/super-admin/settings", label: "Settings", icon: "⚙️" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    const email = session?.user?.email;
    if (!email || email !== SUPER_ADMIN_EMAIL) {
      router.replace("/");
      return;
    }
    setAuthorized(true);
  }, [session, status, router]);

  if (status === "loading" || !authorized) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0f1e] border-r border-slate-800 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Agent Forja
          </h1>
          <p className="text-xs text-slate-500 mt-1">Super Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div className="text-xs">
              <p className="text-slate-300 font-medium truncate">{session?.user?.name}</p>
              <p className="text-slate-500 truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
