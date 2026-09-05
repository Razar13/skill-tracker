"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SkillHeatmap from "@/components/skill-heatmap";
import WeeklyTrendChart from "@/components/weekly-trend-chart";
import SessionModal from "@/components/session-modal";
import ProjectModal from "@/components/project-modal";
import ConfirmDialog from "@/components/confirm-dialog";
import LevelBadgePicker from "@/components/level-badge-picker";

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
  level: string;
  createdAt: string;
  sessions: PracticeSessionT[];
  projects: Project[];
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
  const router = useRouter();
  const skillId = params.id;

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionModal, setSessionModal] = useState<{ open: boolean; editing: PracticeSessionT | null }>({
    open: false,
    editing: null,
  });
  const [projectModal, setProjectModal] = useState<{ open: boolean; editing: Project | null }>({
    open: false,
    editing: null,
  });
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteSkillOpen, setDeleteSkillOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleLevelChange(level: string) {
    if (!skill) return;
    setSkill({ ...skill, level }); // optimistic
    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchSkill(); // revert on failure
    }
  }

  async function handleDeleteSession() {
    if (!deleteSessionId) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/sessions/${deleteSessionId}`, { method: "DELETE" });
      setDeleteSessionId(null);
      fetchSkill();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteProject() {
    if (!deleteProjectId || !skill) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/skills/${skill.id}/projects/${deleteProjectId}`, { method: "DELETE" });
      setDeleteProjectId(null);
      fetchSkill();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteSkill() {
    if (!skill) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/skills/${skill.id}`, { method: "DELETE" });
      router.push("/dashboard/skills");
    } finally {
      setIsDeleting(false);
    }
  }

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
      return { dateStr, label: d.toLocaleDateString("en-US", { weekday: "short" }), minutes };
    });

    return { totalMins, weekMins, monthMins, avgMins, currentStreak: current, longestStreak: longest, trend };
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
              <LevelBadgePicker level={skill.level} onChange={handleLevelChange} />
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDeleteSkillOpen(true)}
            className="px-3 py-2.5 border border-zinc-800 hover:border-red-800 hover:text-red-400 text-zinc-500 text-sm rounded-lg transition-colors"
          >
            Delete Skill
          </button>
          <button
            onClick={() => setSessionModal({ open: true, editing: null })}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-lg transition-colors"
          >
            📅 Log Practice Session
          </button>
        </div>
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
              onClick={() => setProjectModal({ open: true, editing: null })}
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
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium px-2 py-1 bg-amber-900/30 text-amber-500 rounded-full whitespace-nowrap">
                        {project._count.sessions} session{project._count.sessions === 1 ? "" : "s"}
                      </span>
                      <button
                        onClick={() => setProjectModal({ open: true, editing: project })}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteProjectId(project.id)}
                        className="text-xs text-zinc-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
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
          <h2 className="text-lg font-bold text-white mb-4">Recent Sessions</h2>

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
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs font-medium text-amber-500">{s.durationMinutes}m</span>
                    {s.project && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {s.project.name}
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSessionModal({ open: true, editing: s })}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteSessionId(s.id)}
                        className="text-[11px] text-zinc-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
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

      <SessionModal
        isOpen={sessionModal.open}
        skillId={skill.id}
        projects={skill.projects.map((p) => ({ id: p.id, name: p.name }))}
        session={sessionModal.editing}
        onClose={() => setSessionModal({ open: false, editing: null })}
        onSaved={fetchSkill}
      />

      <ProjectModal
        isOpen={projectModal.open}
        skillId={skill.id}
        project={projectModal.editing}
        onClose={() => setProjectModal({ open: false, editing: null })}
        onSaved={fetchSkill}
      />

      <ConfirmDialog
        isOpen={!!deleteSessionId}
        title="Delete session?"
        message="This will permanently remove this practice session. This can't be undone."
        isSubmitting={isDeleting}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={handleDeleteSession}
      />

      <ConfirmDialog
        isOpen={!!deleteProjectId}
        title="Delete project?"
        message="Sessions linked to this project will keep their history but lose the project tag."
        isSubmitting={isDeleting}
        onClose={() => setDeleteProjectId(null)}
        onConfirm={handleDeleteProject}
      />

      <ConfirmDialog
        isOpen={deleteSkillOpen}
        title="Delete this skill?"
        message="This permanently deletes the skill along with all its sessions, projects, and attachments. This can't be undone."
        isSubmitting={isDeleting}
        onClose={() => setDeleteSkillOpen(false)}
        onConfirm={handleDeleteSkill}
      />
    </div>
  );
}