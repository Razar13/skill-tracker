"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "⊞" },
    { name: "My Skills", href: "/dashboard/skills", icon: "📚" },
    { name: "Practice Log", href: "/dashboard", icon: "≡" },
    { name: "Stats", href: "/stats", icon: "📊" },
    { name: "Settings", href: "/dashboard", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-[#121212] text-zinc-100 font-sans overflow-hidden">
      <aside className="w-64 border-r border-zinc-800/50 flex flex-col bg-[#121212] flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
          <span className="text-amber-500 mr-2 text-xl">🎵</span>
          <span className="font-bold text-lg tracking-wide text-zinc-100">Skill Tracker</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            // Check if current path matches the href exactly
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-900/20 border border-amber-700/50 text-amber-500"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent"
                }`}
              >
                <span className="opacity-80">{item.icon}</span> {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800/50 bg-[#121212] flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search skills or notes..."
                className="w-full bg-[#18181A] border border-zinc-800/50 text-sm text-zinc-200 rounded-lg pl-10 pr-4 py-1.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-zinc-400 hover:text-zinc-100 transition-colors">🔔</button>
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-800/50">
              <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium text-zinc-300">Alex Rivers <span className="text-zinc-500 ml-1">⌄</span></span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}