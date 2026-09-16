"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import AddSkillModal from "@/components/add-skill-modal";
import Mascot from "@/components/mascot";
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

  const { current: streak, daysSinceLast } = useMemo(
    () => calculateGlobalStreak(sessions),
    [sessions]
  );

  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions]);

  if (loading) {
    return <div className="p-8 text-zinc-400 bg-[#121212] min-h-screen">Loading dashboard...</div>;
  }

  return (
    <main className="text-zinc-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {getTimeGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-zinc-500">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Mascot streak={streak} daysSinceLastPractice={daysSinceLast} />
        </header>

        <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Today</h2>
            <span className="text-sm text-zinc-500">
              {doneCount} of {checklist.length} done
            </span>
          </div>

          {checklist.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No skills yet.{" "}
              <Link href="/dashboard/skills/new" className="text-amber-500 hover:text-amber-400">
                Add one
              </Link>{" "}
              to get started.
            </p>
          ) : (
            <div className="space-y-1">
              {checklist.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-lg ${skill.doneToday ? "text-emerald-500" : "text-zinc-600"}`}
                    >
                      {skill.doneToday ? "✓" : "✗"}
                    </span>
                    <span className="text-sm text-zinc-200">{skill.name}</span>
                  </div>
                  {!skill.doneToday && (
                    <Link
                      href={`/dashboard/log?skillId=${skill.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors"
                    >
                      Log
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-5">
            <p className="text-xs text-zinc-500 mb-1">Current streak</p>
            <p className="text-2xl font-bold text-white">
              {streak} {streak === 1 ? "day" : "days"}
            </p>
          </div>
          <Link
            href="/dashboard/log"
            className="bg-[#18181A] rounded-xl border-2 border-amber-500/40 hover:border-amber-500 p-5 flex items-center justify-center transition-colors"
          >
            <span className="font-bold text-amber-500">Log practice</span>
          </Link>
        </div>

        <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Last 3 weeks</h2>
            <Link href="/dashboard/skills" className="text-xs text-zinc-500 hover:text-zinc-300">
              See skills
            </Link>
          </div>
          <MiniHeatmap sessions={sessions} />
        </div>

        <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent sessions</h2>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing logged yet.</p>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex justify-between items-start border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-bold text-zinc-200 text-sm">{session.skill.name}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{session.title}</p>
                  </div>
                  <span className="text-xs font-medium text-amber-500">
                    {session.durationMinutes}m
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