"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { DashboardIcon } from "@/components/icon";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "My Skills", href: "/dashboard/skills", icon: "skills" },
  { name: "Practice Log", href: "/dashboard/log", icon: "log" },
  { name: "Stats", href: "/stats", icon: "stats" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = session?.user?.name || "Guest";
  const avatarSeed = session?.user?.email || session?.user?.name || "guest";

  async function handleSignOut() {
    setMenuOpen(false);
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-[#121212] text-zinc-100 font-sans overflow-hidden">
      <aside className="w-64 border-r border-zinc-800/50 flex flex-col bg-[#121212] flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
          <DashboardIcon name="music" className="text-amber-500 mr-2 text-xl" />
          <span className="font-bold text-lg tracking-wide text-zinc-100">Skill Tracker</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
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
                <DashboardIcon name={item.icon} className="w-4 h-4 opacity-80" /> {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800/50 bg-[#121212] flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <DashboardIcon name="search" className="w-4 h-4 text-zinc-500" />
              </span>
              <input
                type="text"
                placeholder="Search skills or notes..."
                className="w-full bg-[#18181A] border border-zinc-800/50 text-sm text-zinc-200 rounded-lg pl-10 pr-4 py-1.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-zinc-400 hover:text-zinc-100 transition-colors">
              <DashboardIcon name="bell" className="w-5 h-5" />
            </button>

            <div className="relative pl-6 border-l border-zinc-800/50">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-zinc-300">
                  {displayName} <span className="text-zinc-500 ml-1">⌄</span>
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 bg-[#18181A] border border-zinc-800 rounded-lg shadow-xl py-1 min-w-[180px]">
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/70"
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800/70"
                    >
                      Settings
                    </Link>
                    <div className="my-1 border-t border-zinc-800" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800/70"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}