"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface Skill {
  id: string;
  name: string;
  color: string;
}

interface PracticeSession {
  id: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  skill: Skill;
}

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

  // Compute Overall Stats
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

    return {
      totalHours: (totalMins / 60).toFixed(1),
      weekHours: (weekMins / 60).toFixed(1),
      monthHours: (monthMins / 60).toFixed(1),
      totalSessions: sessions.length,
    };
  }, [sessions]);

  // Streak Calculation Function
  const calculateStreak = (skillSessions: PracticeSession[]) => {
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
  };

  if (loading) return <div className="p-6">Loading statistics...</div>;

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Statistics</h1>
          <p className="text-sm text-gray-500">Track your progress and practice streaks</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Time</p>
          <p className="text-2xl font-bold mt-1">{overallStats.totalHours} hrs</p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">This Week</p>
          <p className="text-2xl font-bold mt-1">{overallStats.weekHours} hrs</p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">This Month</p>
          <p className="text-2xl font-bold mt-1">{overallStats.monthHours} hrs</p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">{overallStats.totalSessions}</p>
        </div>
      </div>

      {/* Per Skill Statistics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Skill Breakdowns</h2>
        {skills.length === 0 ? (
          <p className="text-gray-500">No skills to analyze yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill) => {
              const skillSessions = sessions.filter((s) => s.skillId === skill.id);
              const totalMins = skillSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
              const streaks = calculateStreak(skillSessions);

              return (
                <div
                  key={skill.id}
                  className="p-5 bg-white border rounded-xl shadow-sm space-y-4"
                  style={{ borderLeft: `6px solid ${skill.color}` }}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">{skill.name}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-full">
                      {(totalMins / 60).toFixed(1)} hrs total
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                    <div>
                      <p className="text-xs text-gray-500">Sessions</p>
                      <p className="text-lg font-semibold">{skillSessions.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Streak</p>
                      <p className="text-lg font-semibold text-emerald-600">
                        🔥 {streaks.current} {streaks.current === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Best Streak</p>
                      <p className="text-lg font-semibold text-amber-600">
                        🏆 {streaks.longest} {streaks.longest === 1 ? "day" : "days"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}