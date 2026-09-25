"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import AddSkillModal from "@/components/add-skill-modal";
import MiniHeatmap from "@/components/mini-heatmap";
import { authClient } from "@/lib/auth-client";

interface Skill {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  totalMinutes: number;
}

interface PracticeSession {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  date: string;
  skillId: string;
  skill: {
    name: string;
    color: string;
  };
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function calculateGlobalStreak(sessions: PracticeSession[]) {
  if (!sessions.length) return { current: 0, daysSinceLast: Infinity };

  const uniqueDates = Array.from(
    new Set(sessions.map((s) => toDateStr(new Date(s.date))))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = toDateStr(new Date());
  const lastDate = uniqueDates[0];
  const daysSinceLast = Math.round(
    (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24)
  );

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toDateStr(yesterdayDate);

  let current = 0;
  const hasToday = uniqueDates.includes(today);
  const hasYesterday = uniqueDates.includes(yesterday);

  if (hasToday || hasYesterday) {
    let checkDate = new Date(hasToday ? today : yesterday);
    while (true) {
      const dateStr = toDateStr(checkDate);
      if (uniqueDates.includes(dateStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
  }

  return { current, daysSinceLast };
}

function SkillChip({ name, color }: { name: string; color: string }) {
  return (
    <div className="chip" style={{ backgroundColor: color }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function DashboardPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  const { data: session } = authClient.useSession();

  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) setSkills(await res.json());
    } catch (err) {
      console.error("Failed loading skills:", err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Failed loading sessions:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchSkills(), fetchSessions()]);
      setLoading(false);
    }
    init();
  }, [fetchSkills, fetchSessions]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  const checklist = useMemo(() => {
    const doneToday = new Set(
      sessions.filter((s) => toDateStr(new Date(s.date)) === todayStr).map((s) => s.skillId)
    );
    return skills.map((skill) => ({
      ...skill,
      doneToday: doneToday.has(skill.id),
    }));
  }, [skills, sessions, todayStr]);

  const doneCount = checklist.filter((s) => s.doneToday).length;

  const { current: streak } = useMemo(
    () => calculateGlobalStreak(sessions),
    [sessions]
  );

  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions]);

  if (loading) {
    return (
      <div className="p-8 min-h-screen mono text-sm" style={{ color: "var(--ink-faint)" }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="card">
          <h1 className="display text-[28px] leading-tight mb-1">
            {getTimeGreeting()}, {firstName}
          </h1>
          <p className="mono text-xs" style={{ color: "var(--ink-faint)" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="label-head text-[15px] tracking-wide">Today</h2>
            <span className="mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
              {doneCount} OF {checklist.length} DONE
            </span>
          </div>

          {checklist.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
              No skills yet.{" "}
              <Link href="/dashboard/skills/new" className="btn-ghost inline" style={{ color: "var(--amber-dim)" }}>
                Add one
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div>
              {checklist.map((skill) => (
                <div key={skill.id} className="row-rule flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <SkillChip name={skill.name} color={skill.color} />
                    <span className="text-[14.5px]">{skill.name}</span>
                  </div>
                  {skill.doneToday ? (
                    <span style={{ color: "#7bc496", fontSize: 15 }}>✓</span>
                  ) : (
                    <Link href={`/dashboard/log?skillId=${skill.id}`} className="btn-stamp">
                      LOG
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card card-tab-sm">
            <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
              CURRENT STREAK
            </p>
            <p className="display text-2xl">
              {streak} {streak === 1 ? "day" : "days"}
            </p>
          </div>
          <Link
            href="/dashboard/log"
            className="card card-tab-sm flex items-center justify-center transition-colors"
            style={{ borderStyle: "dashed", borderColor: "var(--amber-dim)" }}
          >
            <span className="label-head text-[14.5px]" style={{ color: "var(--amber)" }}>
              + Log practice
            </span>
          </Link>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="label-head text-[15px] tracking-wide">Last 3 weeks</h2>
            <Link href="/dashboard/skills" className="btn-ghost">
              SEE SKILLS →
            </Link>
          </div>
          <MiniHeatmap sessions={sessions} />
        </div>

        <div className="card">
          <h2 className="label-head text-[15px] tracking-wide mb-3">Recent sessions</h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
              Nothing logged yet.
            </p>
          ) : (
            <div>
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="row-rule flex items-start gap-3 py-3 pl-3"
                  style={{ borderLeft: `3px solid ${s.skill.color}` }}
                >
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="mono text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                        {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
                      </span>
                      <span className="label-head text-[13px]" style={{ color: s.skill.color }}>
                        {s.skill.name}
                      </span>
                    </div>
                    <p className="text-[13px] italic" style={{ color: "var(--ink-dim)" }}>
                      {s.title}
                    </p>
                  </div>
                  <span className="mono text-xs shrink-0" style={{ color: "var(--amber-dim)" }}>
                    {s.durationMinutes}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddSkillModal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        onSkillAdded={() => fetchSkills()}
      />
    </main>
  );
}