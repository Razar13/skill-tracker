"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import SkillHeatmap from "@/components/skill-heatmap";
import DashboardLayout from "@/components/dashboard-layout";
import { DashboardIcon } from "@/components/icon";

interface Skill {
  id: string;
  name: string;
  color: string;
  level: string;
}

interface PracticeSession {
  id: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  skill: Skill;
}

function calculateStreak(skillSessions: PracticeSession[]) {
  if (!skillSessions.length) return { current: 0, longest: 0 };

  const uniqueDates = Array.from(
    new Set(skillSessions.map((s) => new Date(s.date).toISOString().split("T")[0]))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  let current = 0;
  let longest = 0;
  let temp = 0;

  const hasToday = uniqueDates.includes(today);
  const hasYesterday = uniqueDates.includes(yesterday);

  if (hasToday || hasYesterday) {
    let checkDate = new Date(hasToday ? today : yesterday);
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDates.includes(dateStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
  }

  if (uniqueDates.length > 0) {
    temp = 1;
    longest = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diffDays = Math.round((curr.getTime() - next.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) temp++;
      else temp = 1;
      if (temp > longest) longest = temp;
    }
  }

  return { current, longest: Math.max(longest, current) };
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "#3b82f6",
  Intermediate: "#f0b13e",
  Advanced: "#a855f7",
};

export default function StatsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [skillsRes, sessionsRes] = await Promise.all([
          fetch("/api/skills"),
          fetch("/api/sessions"),
        ]);
        if (skillsRes.ok) setSkills(await skillsRes.json());
        if (sessionsRes.ok) setSessions(await sessionsRes.json());
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const overallStats = useMemo(() => {
    const totalMins = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekMins = sessions
      .filter((s) => new Date(s.date) >= startOfWeek)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    const monthMins = sessions
      .filter((s) => new Date(s.date) >= startOfMonth)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    const { current: bestCurrentStreak } = sessions.length
      ? calculateStreak(sessions)
      : { current: 0 };

    return {
      totalHours: (totalMins / 60).toFixed(1),
      weekHours: (weekMins / 60).toFixed(1),
      monthHours: (monthMins / 60).toFixed(1),
      totalSessions: sessions.length,
      activeSkills: skills.length,
      bestCurrentStreak,
    };
  }, [sessions, skills]);

  const skillStats = useMemo(() => {
    return skills
      .map((skill) => {
        const skillSessions = sessions.filter((s) => s.skillId === skill.id);
        const totalMins = skillSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
        const streaks = calculateStreak(skillSessions);
        const avgMins = skillSessions.length ? Math.round(totalMins / skillSessions.length) : 0;
        const lastPracticed = skillSessions.length
          ? new Date(
              Math.max(...skillSessions.map((s) => new Date(s.date).getTime()))
            )
          : null;

        return {
          skill,
          totalMins,
          sessionCount: skillSessions.length,
          streaks,
          avgMins,
          lastPracticed,
        };
      })
      .sort((a, b) => b.totalMins - a.totalMins);
  }, [skills, sessions]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 mono text-sm" style={{ color: "var(--ink-faint)" }}>
          Loading statistics...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="display text-[28px] mb-1">Statistics</h1>
              <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                Your practice, at a glance.
              </p>
            </div>
            <Link href="/dashboard" className="btn-stamp">
              ← BACK TO DASHBOARD
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card card-tab-sm">
              <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
                TOTAL TIME
              </p>
              <p className="display text-2xl">{overallStats.totalHours}h</p>
            </div>
            <div className="card card-tab-sm">
              <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
                THIS WEEK
              </p>
              <p className="display text-2xl">{overallStats.weekHours}h</p>
            </div>
            <div className="card card-tab-sm">
              <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
                THIS MONTH
              </p>
              <p className="display text-2xl">{overallStats.monthHours}h</p>
            </div>
            <div className="card card-tab-sm">
              <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
                SESSIONS
              </p>
              <p className="display text-2xl">{overallStats.totalSessions}</p>
            </div>
            <div className="card card-tab-sm" style={{ "--tab-color": "var(--amber)" } as React.CSSProperties}>
              <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
                BEST STREAK
              </p>
              <p className="display text-2xl" style={{ color: "var(--amber)" }}>
                🔥 {overallStats.bestCurrentStreak}
              </p>
            </div>
          </div>

          <div className="card">
            <SkillHeatmap sessions={sessions} />
          </div>

          <div>
            <h2 className="label-head text-[17px] tracking-wide mb-4">Skill Breakdown</h2>
            {skillStats.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                  No skills to analyze yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillStats.map(({ skill, totalMins, sessionCount, streaks, avgMins, lastPracticed }) => {
                  const levelColor = LEVEL_COLORS[skill.level] || LEVEL_COLORS.Beginner;
                  return (
                    <Link
                      key={skill.id}
                      href={`/dashboard/skills/${skill.id}`}
                      className="card space-y-4 transition-colors hover:brightness-110 block"
                      style={{ "--tab-color": skill.color } as React.CSSProperties}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className="chip" style={{ backgroundColor: skill.color }}>
                            {skill.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="label-head text-[17px]">{skill.name}</h3>
                            <span
                              className="inline-block mt-1 mono text-[9px] tracking-widest px-2 py-0.5 rounded-full"
                              style={{ color: levelColor, background: `${levelColor}18` }}
                            >
                              {skill.level.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span
                          className="mono text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "var(--card-raised)", color: "var(--ink-dim)" }}
                        >
                          {(totalMins / 60).toFixed(1)}h total
                        </span>
                      </div>

                      <div
                        className="grid grid-cols-4 gap-2 pt-3 text-center"
                        style={{ borderTop: "1px dashed var(--rule)" }}
                      >
                        <div>
                          <p className="mono text-[9px] tracking-wide" style={{ color: "var(--ink-faint)" }}>
                            SESSIONS
                          </p>
                          <p className="label-head text-base mt-0.5">{sessionCount}</p>
                        </div>
                        <div>
                          <p className="mono text-[9px] tracking-wide" style={{ color: "var(--ink-faint)" }}>
                            AVG
                          </p>
                          <p className="label-head text-base mt-0.5">{avgMins}m</p>
                        </div>
                        <div>
                          <p className="mono text-[9px] tracking-wide" style={{ color: "var(--ink-faint)" }}>
                            STREAK
                          </p>
                          <p className="label-head text-base mt-0.5" style={{ color: "#7bc496" }}>
                            🔥 {streaks.current}
                          </p>
                        </div>
                        <div>
                          <p className="mono text-[9px] tracking-wide" style={{ color: "var(--ink-faint)" }}>
                            BEST
                          </p>
                          <p
                            className="label-head text-base mt-0.5 inline-flex items-center gap-1"
                            style={{ color: "var(--amber)" }}
                          >
                            <DashboardIcon name="trophy" className="w-3.5 h-3.5" /> {streaks.longest}
                          </p>
                        </div>
                      </div>

                      {lastPracticed && (
                        <p className="mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                          LAST PRACTICED{" "}
                          {lastPracticed
                            .toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            .toUpperCase()}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}