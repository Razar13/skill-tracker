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
import { DashboardIcon } from "@/components/icon";

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

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [visibleSessionCount, setVisibleSessionCount] = useState(3);

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
    return (
      <div className="p-8 mono text-sm" style={{ color: "var(--ink-faint)" }}>
        Loading skill...
      </div>
    );
  }

  if (error || !skill || !stats) {
    return (
      <div className="p-8">
        <p className="text-sm mb-4" style={{ color: "var(--ink-dim)" }}>
          {error || "Skill not found."}
        </p>
        <Link href="/dashboard/skills" className="btn-ghost" style={{ color: "var(--amber-dim)" }}>
          ← Back to My Skills
        </Link>
      </div>
    );
  }

  const totalHours = Math.floor(stats.totalMins / 60);
  const totalRemainderMins = stats.totalMins % 60;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-5">
      <div className="text-sm mono" style={{ color: "var(--ink-faint)" }}>
        <Link href="/dashboard/skills" style={{ color: "var(--ink-dim)" }}>
          My Skills
        </Link>
        <span className="mx-2">/</span>
        <span style={{ color: "var(--amber)" }}>{skill.name}</span>
      </div>

      <div
        className="card card-tab-sm flex items-center justify-between flex-wrap gap-4"
        style={{ "--tab-color": skill.color } as React.CSSProperties}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center display text-2xl border"
            style={{ backgroundColor: `${skill.color}22`, borderColor: `${skill.color}55`, color: skill.color }}
          >
            {skill.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="display text-[26px]">{skill.name}</h1>
              <LevelBadgePicker level={skill.level} onChange={handleLevelChange} />
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--ink-faint)" }}>
              Total:{" "}
              <span className="mono" style={{ color: "var(--ink)" }}>
                {totalHours}h {totalRemainderMins}m
              </span>
              {"  ·  "}
              Streak:{" "}
              <span className="mono" style={{ color: "var(--amber)" }}>
                🔥 {stats.currentStreak} days
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDeleteSkillOpen(true)}
            className="btn-stamp"
            style={{ color: "var(--ink-faint)", borderColor: "var(--rule)" }}
          >
            DELETE SKILL
          </button>
          <button onClick={() => setSessionModal({ open: true, editing: null })} className="btn-primary">
            <span className="inline-flex items-center gap-1.5">
              <DashboardIcon name="calendar" className="w-4 h-4" /> Log Practice Session
            </span>
          </button>
        </div>
      </div>

      <div className="card space-y-8">
        <SkillHeatmap sessions={skill.sessions} />
        <div>
          <h3 className="label-head text-[15px] tracking-wide mb-4">Last 7 Days</h3>
          <WeeklyTrendChart data={stats.trend} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="label-head text-[15px] tracking-wide">Projects</h2>
            <button onClick={() => setProjectModal({ open: true, editing: null })} className="btn-stamp">
              + CREATE PROJECT
            </button>
          </div>

          {skill.projects.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                No projects yet. Start one to group related sessions together.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {skill.projects.map((project) => {
                const isExpanded = expandedProjectId === project.id;
                const projectSessions = skill.sessions.filter((s) => s.project?.id === project.id);

                return (
                  <div key={project.id} className="card">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                        className="flex items-center gap-1.5 text-left"
                      >
                        <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                          {isExpanded ? "▾" : "▸"}
                        </span>
                        <h3 className="label-head text-[15px]">{project.name}</h3>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="mono text-[10px] tracking-wide px-2 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "rgba(240,177,62,0.1)", color: "var(--amber)" }}
                        >
                          {project._count.sessions} SESSION{project._count.sessions === 1 ? "" : "S"}
                        </span>
                        <button
                          onClick={() => setProjectModal({ open: true, editing: project })}
                          className="btn-ghost"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => setDeleteProjectId(project.id)}
                          className="btn-ghost"
                          style={{ color: "#c66" }}
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm mb-3" style={{ color: "var(--ink-dim)" }}>
                        {project.description}
                      </p>
                    )}
                    <p className="mono text-[11px]" style={{ color: "var(--ink-faint)" }}>
                      STARTED{" "}
                      {new Date(project.createdAt)
                        .toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        .toUpperCase()}
                    </p>

                    {isExpanded && (
                      <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1px dashed var(--rule)" }}>
                        {projectSessions.length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
                            No sessions logged for this project yet.
                          </p>
                        ) : (
                          projectSessions.map((s) => (
                            <div key={s.id} className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="mono text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                                    {new Date(s.date)
                                      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                      .toUpperCase()}
                                  </span>
                                  <span className="text-sm" style={{ color: "var(--ink)" }}>
                                    {s.title}
                                  </span>
                                </div>
                                {s.description && (
                                  <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
                                    {s.description}
                                  </p>
                                )}
                              </div>
                              <span className="mono text-xs shrink-0" style={{ color: "var(--amber-dim)" }}>
                                {s.durationMinutes}m
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="label-head text-[15px] tracking-wide mb-4">Recent Sessions</h2>

          {skill.sessions.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                No sessions logged yet.
              </p>
            </div>
          ) : (
            <>
              <div className="card">
                {skill.sessions.slice(0, visibleSessionCount).map((s) => (
                  <div key={s.id} className="row-rule flex justify-between items-start py-3.5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-[10.5px]" style={{ color: "var(--ink-faint)" }}>
                          {new Date(s.date)
                            .toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            .toUpperCase()}
                        </span>
                        <span className="label-head text-[14px]">{s.title}</span>
                      </div>
                      {s.description && (
                        <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="mono text-xs" style={{ color: "var(--amber-dim)" }}>
                        {s.durationMinutes}m
                      </span>
                      {s.project && (
                        <span
                          className="mono text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "var(--card-raised)", color: "var(--ink-faint)" }}
                        >
                          {s.project.name}
                        </span>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setSessionModal({ open: true, editing: s })} className="btn-ghost">
                          EDIT
                        </button>
                        <button
                          onClick={() => setDeleteSessionId(s.id)}
                          className="btn-ghost"
                          style={{ color: "#c66" }}
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {visibleSessionCount < skill.sessions.length && (
                <button
                  onClick={() => setVisibleSessionCount((c) => Math.min(c + 10, skill.sessions.length))}
                  className="btn-stamp mt-3 w-full"
                >
                  SHOW MORE ({skill.sessions.length - visibleSessionCount} REMAINING)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card card-tab-sm">
          <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
            THIS WEEK
          </p>
          <p className="display text-2xl">
            {Math.floor(stats.weekMins / 60)}h {stats.weekMins % 60}m
          </p>
        </div>
        <div className="card card-tab-sm">
          <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
            THIS MONTH
          </p>
          <p className="display text-2xl">
            {Math.floor(stats.monthMins / 60)}h {stats.monthMins % 60}m
          </p>
        </div>
        <div className="card card-tab-sm">
          <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
            AVG SESSION
          </p>
          <p className="display text-2xl">{stats.avgMins} mins</p>
        </div>
        <div className="card card-tab-sm">
          <p className="mono text-[10px] tracking-widest mb-1.5" style={{ color: "var(--ink-faint)" }}>
            LONGEST STREAK
          </p>
          <p className="display text-2xl">{stats.longestStreak} days</p>
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