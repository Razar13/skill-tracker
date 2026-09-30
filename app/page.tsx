"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { getHeatmapCellColor } from "@/lib/heatmap-colors";
import { CATEGORY_COLORS } from "@/lib/skill-catalog";

const DEMO_SKILLS = [
  { name: "Guitar", color: CATEGORY_COLORS.Music, done: true },
  { name: "English", color: CATEGORY_COLORS.Languages, done: true },
  { name: "Python", color: CATEGORY_COLORS.Programming, done: false },
  { name: "Drawing", color: CATEGORY_COLORS["Art & Design"], done: false },
];

const DEMO_MINUTES = [0, 25, 40, 0, 60, 35, 0, 45, 90, 30, 0, 50, 70, 20, 45, 0, 60, 80, 40, 55, 95];

const FEATURES = [
  { title: "Log every session", text: "A title, a duration, a date and a few notes. It takes ten seconds.", color: CATEGORY_COLORS.Music },
  { title: "See your consistency", text: "A year-long heatmap shows at a glance how regularly you practice.", color: CATEGORY_COLORS.Programming },
  { title: "Keep your streaks", text: "Daily streaks, weekly totals and per-skill stats keep you honest.", color: CATEGORY_COLORS.Languages },
];

const STEPS = [
  { n: "01", title: "Pick a skill", text: "Choose one from the catalog or create your own." },
  { n: "02", title: "Log your practice", text: "Add a session after each time you practice." },
  { n: "03", title: "Watch it add up", text: "Follow your hours, streaks and level over time." },
];

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const doneCount = DEMO_SKILLS.filter((s) => s.done).length;

  return (
    <main className="min-h-screen" style={{ color: "var(--ink)" }}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded flex items-center justify-center display text-base"
              style={{ background: "var(--amber)", color: "#1a1207", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
            >
              S
            </div>
            <span className="label-head text-lg">Skill Tracker</span>
          </Link>

          <nav className="hidden gap-8 text-sm md:flex" style={{ color: "var(--ink-dim)" }}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </nav>

          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded" style={{ background: "var(--card)" }} />
          ) : session ? (
            <div className="flex items-center gap-4">
              <span className="hidden text-sm sm:inline" style={{ color: "var(--ink-dim)" }}>
                Hi, {session.user.name}
              </span>
              <Link href="/dashboard" className="btn-stamp inline-block">
                DASHBOARD
              </Link>
              <button onClick={() => authClient.signOut()} className="btn-ghost">
                SIGN OUT
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-stamp inline-block">
              SIGN IN
            </Link>
          )}
        </header>

        <section className="grid items-center gap-16 py-20 lg:grid-cols-2">
          <div>
            <span
              className="mono rounded-full px-3 py-1 text-[11px] tracking-widest"
              style={{ border: "1px solid var(--amber-dim)", color: "var(--amber)" }}
            >
              TRACK YOUR PROGRESS
            </span>

            <h2 className="display mt-6 text-5xl leading-tight md:text-6xl">
              Track your progress.
              <br />
              Master any skill.
            </h2>

            <p className="mt-6 max-w-xl text-lg" style={{ color: "var(--ink-dim)" }}>
              Log practice sessions, track your growth, and build expertise through consistent effort.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {session ? (
                <Link href="/dashboard" className="btn-primary inline-block">
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn-primary inline-block">
                    Get started free
                  </Link>
                  <Link href="/login" className="btn-stamp inline-block">
                    SIGN IN
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ "--tab-color": "var(--amber)" } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="label-head text-[15px] tracking-wide">Today</h3>
              <span className="mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
                {doneCount} OF {DEMO_SKILLS.length} DONE
              </span>
            </div>

            {DEMO_SKILLS.map((skill) => (
              <div key={skill.name} className="row-rule flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="chip" style={{ backgroundColor: skill.color }}>
                    {skill.name.charAt(0)}
                  </div>
                  <span className="text-[14.5px]">{skill.name}</span>
                </div>
                {skill.done ? (
                  <span style={{ color: "#7bc496", fontSize: 15 }}>✓</span>
                ) : (
                  <span className="mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    TO DO
                  </span>
                )}
              </div>
            ))}

            <div className="mt-5 pt-4" style={{ borderTop: "1px dashed var(--rule)" }}>
              <p className="mono text-[10px] tracking-widest mb-2" style={{ color: "var(--ink-faint)" }}>
                LAST 3 WEEKS
              </p>
              <div
                className="grid gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${DEMO_MINUTES.length}, minmax(0, 1fr))` }}
              >
                {DEMO_MINUTES.map((m, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[2px]"
                    style={{ backgroundColor: getHeatmapCellColor(m, DEMO_MINUTES) || "#241c12" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16">
          <h2 className="display text-3xl mb-8">Everything you need to stay consistent</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ "--tab-color": f.color } as React.CSSProperties}>
                <h3 className="label-head text-[17px] mt-2 mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-16">
          <h2 className="display text-3xl mb-8">How it works</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="row-rule pb-5 md:border-b-0">
                <p className="mono text-xs tracking-widest mb-2" style={{ color: "var(--amber)" }}>
                  {s.n}
                </p>
                <h3 className="label-head text-[17px] mb-1">{s.title}</h3>
                <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="py-10 text-center">
          <p className="mono text-[10px] tracking-widest" style={{ color: "var(--ink-faint)" }}>
            SKILL TRACKER · PRACTICE LEDGER
          </p>
        </footer>
      </div>
    </main>
  );
}