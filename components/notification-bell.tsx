"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "@/components/icon";
import { buildNotifications, type NotificationPrefs } from "@/lib/notifications";

const DISMISSED_KEY = "skill-tracker:dismissed-notifications";

interface SkillLite {
  id: string;
  name: string;
  color: string;
}

interface SessionLite {
  skillId: string;
  durationMinutes: number;
  date: string;
}

interface BellData {
  prefs: NotificationPrefs;
  skills: SkillLite[];
  sessions: SessionLite[];
}

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function NotificationBell() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BellData | null>(null);
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  const load = useCallback(async () => {
    try {
      const [pRes, kRes, sRes] = await Promise.all([
        fetch("/api/notifications/preferences"),
        fetch("/api/skills"),
        fetch("/api/sessions"),
      ]);
      if (!pRes.ok || !kRes.ok || !sRes.ok) return;
      const [prefs, skills, sessions] = await Promise.all([pRes.json(), kRes.json(), sRes.json()]);
      setData({ prefs, skills, sessions });
    } catch (err) {
      console.error("Failed loading notifications:", err);
    }
  }, []);

  // Refresh when the page changes (e.g. after logging a session), when the
  // window regains focus, and when Settings changes a toggle.
  useEffect(() => {
    load();
  }, [pathname, load]);

  useEffect(() => {
    window.addEventListener("focus", load);
    window.addEventListener("notification-prefs-changed", load);
    return () => {
      window.removeEventListener("focus", load);
      window.removeEventListener("notification-prefs-changed", load);
    };
  }, [load]);

  const visible = useMemo(() => {
    if (!data) return [];
    return buildNotifications(data).filter((n) => !dismissed.includes(n.id));
  }, [data, dismissed]);

  function persist(next: string[]) {
    const trimmed = next.slice(-100);
    setDismissed(trimmed);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(trimmed));
    } catch {
      // storage unavailable: dismissal just won't persist
    }
  }

  function toggleOpen() {
    if (!open) load();
    setOpen((o) => !o);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative transition-colors"
        style={{ color: "var(--ink-dim)" }}
      >
        <DashboardIcon name="bell" className="w-5 h-5" />
        {visible.length > 0 && (
          <span
            className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full mono text-[9px] font-medium flex items-center justify-center"
            style={{ background: "var(--amber)", color: "#1a1207" }}
          >
            {visible.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-3 z-20 rounded shadow-xl w-80"
            style={{ background: "var(--card)", border: "1px solid var(--rule)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--rule)" }}
            >
              <h3 className="label-head text-[14px] tracking-wide">Notifications</h3>
              {visible.length > 0 && (
                <button
                  type="button"
                  onClick={() => persist([...dismissed, ...visible.map((n) => n.id)])}
                  className="btn-ghost"
                >
                  CLEAR ALL
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--ink-faint)" }}>
                You&apos;re all caught up.
              </p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {visible.map((n) => (
                  <div
                    key={n.id}
                    className="row-rule flex items-start gap-2 px-4 py-3"
                    style={{ borderLeft: `3px solid ${n.color || "var(--amber)"}` }}
                  >
                    <Link href={n.href} onClick={() => setOpen(false)} className="flex-1 min-w-0">
                      <p className="label-head text-[13px]">{n.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--ink-dim)" }}>
                        {n.body}
                      </p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => persist([...dismissed, n.id])}
                      aria-label="Dismiss"
                      className="btn-ghost shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--rule)" }}>
              <Link href="/settings" onClick={() => setOpen(false)} className="btn-ghost">
                NOTIFICATION SETTINGS →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}