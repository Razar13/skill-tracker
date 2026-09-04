"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SkillHeatmap from "@/components/skill-heatmap";
import WeeklyTrendChart from "@/components/weekly-trend-chart";
import LogPracticeModal from "@/components/log-practice-modal";
import CreateProjectModal from "@/components/create-project-modal";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { sessions: number };
}

interface PracticeSessionT {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  date: string;
  project: { id: string; name: string } | null;
}

interface SkillDetail {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  sessions: PracticeSessionT[];
  projects: Project[];
}

function getSkillLevel(totalMinutes: number) {
  const hours = totalMinutes / 60;
  if (hours >= 50) return "Advanced";
  if (hours >= 20) return "Intermediate";
  return "Beginner";
}

function calculateStreaks(sessions: PracticeSessionT[]) {
  if (!sessions.length) return { current: 0, longest: 0 };
  const uniqueDates = Array.from(
    new Set(sessions.map((s) => new Date(s.date).toISOString().split("T")[0]))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  let current = 0;
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

  let longest = 1;
  let temp = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const curr = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((curr.getTime() - next.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) temp++;
    else temp = 1;
    if (temp > longest) longest = temp;
  }

  return { current, longest: Math.max(longest, current) };
}

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const skillId = params.id;

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  const fetchSkill = useCallback(async () => {
    try {
      const res = await fetch(`/api/skills/${skillId}`);
      if (res.status === 404) {
        setError("Skill not found.");
        return;
      }
      if (res.ok) setSkill(await res.json());
    } catch (err) {
      console.error("Failed loading skill:", err);
      setError("Failed to load skill.");
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  const stats = useMemo(() => {
    if (!skill) return null;
    const sessions = skill.sessions;
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

    const avgMins = sessions.length ? Math.round(totalMins / sessions.length) : 0;
    const { current, longest } = calculateStreaks(sessions);

    const trend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const minutes = sessions
        .filter((s) => new Date(s.date).toISOString().split("T")[0] === dateStr)
        .reduce((acc, s) => acc + s.durationMinutes, 0);
      return {
        dateStr,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        minutes,
      };
    });

    return {
      totalMins,
      weekMins,
      monthMins,
      avgMins,
      currentStreak: current,
      longestStreak: longest,
      trend,
    };
  }, [skill]);

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading skill...</div>;
  }

  if (error || !skill || !stats) {
    return (
      <div className="p-8">
        <p className="text-zinc-400 mb-4">{error || "Skill not found."}</p>
        <Link href="/dashboard/skills" className="text-amber-500 hover:text-amber-400">
          ← Back to My Skills
        </Link>
      </div>
    );
  }

  const totalHours = Math.floor(stats.totalMins / 60);
  const totalRemainderMins = stats.totalMins % 60;
  const level = getSkillLevel(stats.totalMins);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="text-sm text-zinc-500">
        <Link href="/dashboard/skills" className="hover:text-zinc-300">
          My Skills
        </Link>
        <span className="mx-2">{">"}</span>
        <span className="text-amber-500 font-medium">{skill.name}</span>
      </div>

      <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl border"
            style={{ backgroundColor: `${skill.color}22`, borderColor: `${skill.color}55` }}
          >
            🎵
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{skill.name}</h1>
              <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-amber-900/30 text-amber-500 border border-amber-700/40">
                {level}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              Total:{" "}
              <span className="text-zinc-300 font-medium">
                {totalHours}h {totalRemainderMins}m
              </span>
              {"  ·  "}
              Streak: <span className="text-amber-500 font-medium">🔥 {stats.currentStreak} days</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsLogOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-lg transition-colors"
        >
          📅 Log Practice Session
        </button>
      </div>

      <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 space-y-8">
        <SkillHeatmap sessions={skill.sessions} />
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide mb-4">Last 7 Days</h3>
          <WeeklyTrendChart data={stats.trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Projects</h2>
            <button
              onClick={() => setIsProjectOpen(true)}
              className="px-3 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded transition-colors"
            >
              + Create Project
            </button>
          </div>

          {skill.projects.length === 0 ? (
            <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 text-center text-zinc-500 text-sm">
              No projects yet. Start one to group related sessions together.
            </div>
          ) : (
            <div className="space-y-4">
              {skill.projects.map((project) => (
                <div key={project.id} className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-5">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="font-bold text-white">{project.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-amber-900/30 text-amber-500 rounded-full whitespace-nowrap">
                      {project._count.sessions} session{project._count.sessions === 1 ? "" : "s"}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-zinc-400 mb-3">{project.description}</p>
                  )}
                  <p className="text-xs text-zinc-600">
                    Started:{" "}
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Recent Sessions</h2>
          </div>

          {skill.sessions.length === 0 ? (
            <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 text-center text-zinc-500 text-sm">
              No sessions logged yet.
            </div>
          ) : (
            <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 space-y-4">
              {skill.sessions.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-start border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">
                        {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="font-bold text-zinc-200 text-sm">{s.title}</span>
                    </div>
                    {s.description && <p className="text-xs text-zinc-400">{s.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium text-amber-500">{s.durationMinutes}m</span>
                    {s.project && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {s.project.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase font-medium">This Week</p>
          <p className="text-2xl font-bold text-white mt-1">
            {Math.floor(stats.weekMins / 60)}h {stats.weekMins % 60}m
          </p>
        </div>
        <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase font-medium">This Month</p>
          <p className="text-2xl font-bold text-white mt-1">
            {Math.floor(stats.monthMins / 60)}h {stats.monthMins % 60}m
          </p>
        </div>
        <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase font-medium">Avg Session</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.avgMins} mins</p>
        </div>
        <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase font-medium">Longest Streak</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.longestStreak} days</p>
        </div>
      </div>

      <LogPracticeModal
        isOpen={isLogOpen}
        skills={[{ id: skill.id, name: skill.name }]}
        projects={skill.projects.map((p) => ({ id: p.id, name: p.name }))}
        lockedSkillId={skill.id}
        onClose={() => setIsLogOpen(false)}
        onSessionLogged={() => fetchSkill()}
      />
      <CreateProjectModal
        isOpen={isProjectOpen}
        skillId={skill.id}
        onClose={() => setIsProjectOpen(false)}
        onProjectCreated={() => fetchSkill()}
      />
    </div>
  );
}