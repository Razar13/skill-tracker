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
  const avatarSrc =
    session?.user?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;

  async function handleSignOut() {
    setMenuOpen(false);
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="flex h-screen text-[var(--ink)] overflow-hidden" style={{ background: "var(--bg)" }}>
      <aside
        className="w-64 flex flex-col flex-shrink-0"
        style={{ background: "var(--bg)", borderRight: "1px solid var(--rule)" }}
      >
        <div className="h-16 flex items-center gap-2.5 px-6" style={{ borderBottom: "1px solid var(--rule)" }}>
          <div
            className="w-8 h-8 rounded flex items-center justify-center display text-sm"
            style={{ background: "var(--amber)", color: "#1a1207", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
          >
            S
          </div>
          <div>
            <div className="label-head text-[15px] leading-none">Skill Tracker</div>
            <div className="mono text-[9px] tracking-widest mt-1" style={{ color: "var(--ink-faint)" }}>
              PRACTICE LEDGER
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
                style={
                  isActive
                    ? { background: "rgba(240,177,62,0.1)", border: "1px solid var(--amber-dim)", color: "var(--amber)", fontFamily: "'Zilla Slab', serif", fontWeight: 600 }
                    : { color: "var(--ink-dim)", border: "1px solid transparent" }
                }
              >
                <DashboardIcon name={item.icon} className="w-4 h-4 opacity-80" /> {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="h-16 flex items-center justify-between px-8 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <DashboardIcon name="search" className="w-4 h-4" style={{ opacity: 0.6 }} />
              </span>
              <input
                type="text"
                placeholder="Search skills or notes..."
                className="w-full text-sm rounded pl-10 pr-4 py-1.5 focus:outline-none transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--rule)", color: "var(--ink)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="transition-colors" style={{ color: "var(--ink-dim)" }}>
              <DashboardIcon name="bell" className="w-5 h-5" />
            </button>

            <div className="relative pl-6" style={{ borderLeft: "1px solid var(--rule)" }}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full overflow-hidden" style={{ background: "var(--card-raised)" }}>
                  <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm" style={{ color: "var(--ink-dim)" }}>
                  {displayName} <span style={{ color: "var(--ink-faint)" }}>⌄</span>
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 z-20 rounded shadow-xl py-1 min-w-[180px]"
                    style={{ background: "var(--card)", border: "1px solid var(--rule)" }}
                  >
                    <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm" style={{ color: "var(--ink-dim)" }}>
                      Edit Profile
                    </Link>
                    <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm" style={{ color: "var(--ink-dim)" }}>
                      Settings
                    </Link>
                    <div className="my-1" style={{ borderTop: "1px solid var(--rule)" }} />
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-400">
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