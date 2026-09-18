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

const LEVEL_STYLES: Record<string, string> = {
  Beginner: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  Intermediate: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  Advanced: "text-purple-400 bg-purple-400/10 border-purple-400/30",
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
        <div className="p-8 text-zinc-400">Loading statistics...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="text-zinc-100 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {
          <main className="min-h-screen bg-[#121212] text-zinc-100 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Statistics</h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Your practice, at a glance.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm bg-[#18181A] hover:bg-zinc-800 border border-zinc-800/50 text-zinc-300 rounded-lg font-medium transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wide">Total Time</p>
                <p className="text-2xl font-bold text-white mt-1">{overallStats.totalHours}h</p>
              </div>
              <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-white mt-1">{overallStats.weekHours}h</p>
              </div>
              <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wide">This Month</p>
                <p className="text-2xl font-bold text-white mt-1">{overallStats.monthHours}h</p>
              </div>
              <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wide">Sessions</p>
                <p className="text-2xl font-bold text-white mt-1">{overallStats.totalSessions}</p>
              </div>
              <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-5">
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wide">Best Streak</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">
                  🔥 {overallStats.bestCurrentStreak}
                </p>
              </div>
            </div>

            {/* Yearly Heatmap (reuses the fixed SkillHeatmap component) */}
            <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6">
              <SkillHeatmap sessions={sessions} />
            </div>

            {/* Per-skill breakdown */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Skill Breakdown</h2>
              {skillStats.length === 0 ? (
                <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 text-center text-zinc-500 text-sm">
                  No skills to analyze yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillStats.map(({ skill, totalMins, sessionCount, streaks, avgMins, lastPracticed }) => (
                    <Link
                      key={skill.id}
                      href={`/dashboard/skills/${skill.id}`}
                      className="bg-[#18181A] border border-zinc-800/50 hover:border-zinc-700 rounded-xl p-5 space-y-4 transition-colors block"
                      style={{ borderLeft: `4px solid ${skill.color}` }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-white">{skill.name}</h3>
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                              LEVEL_STYLES[skill.level] || LEVEL_STYLES.Beginner
                            }`}
                          >
                            {skill.level}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-full whitespace-nowrap">
                          {(totalMins / 60).toFixed(1)}h total
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-800/50 text-center">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Sessions</p>
                          <p className="text-base font-semibold text-zinc-200">{sessionCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Avg</p>
                          <p className="text-base font-semibold text-zinc-200">{avgMins}m</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Streak</p>
                          <p className="text-base font-semibold text-emerald-500">🔥 {streaks.current}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase">Best</p>
                          <p className="text-base font-semibold text-amber-500 inline-flex items-center gap-1">
                            <DashboardIcon name="trophy" className="w-3.5 h-3.5" /> {streaks.longest}
                          </p>
                        </div>
                      </div>

                      {lastPracticed && (
                        <p className="text-xs text-zinc-600">
                          Last practiced{" "}
                          {lastPracticed.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        } 
        </div>
      </main>
    </DashboardLayout>
  );
}