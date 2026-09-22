"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Skill {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
}

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

function LogPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("skillId");

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [skillId, setSkillId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/skills");
        if (res.ok) setSkills(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (preselectedId && skills.some((s) => s.id === preselectedId)) {
      setSkillId(preselectedId);
      setStep("details");
    }
  }, [preselectedId, skills]);

  useEffect(() => {
    if (!skillId) {
      setProjects([]);
      return;
    }
    async function loadProjects() {
      try {
        const res = await fetch(`/api/skills/${skillId}/projects`);
        if (res.ok) setProjects(await res.json());
      } catch (err) {
        console.error("Failed loading projects:", err);
      }
    }
    loadProjects();
  }, [skillId]);

  const selectedSkill = useMemo(
    () => skills.find((s) => s.id === skillId) || null,
    [skills, skillId]
  );

  function chooseSkill(id: string) {
    setSkillId(id);
    setProjectId("");
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const totalMinutes = hours * 60 + minutes;
    if (!skillId) {
      setError("Choose a skill first.");
      return;
    }
    if (!title.trim()) {
      setError("Give the session a title.");
      return;
    }
    if (totalMinutes <= 0) {
      setError("Duration must be more than 0 minutes.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skillId,
        projectId: projectId || null,
        title: title.trim(),
        description: description.trim(),
        durationMinutes: totalMinutes,
        date,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Couldn't log the session.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-8 mono text-sm" style={{ color: "var(--ink-faint)" }}>
        Loading...
      </div>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="btn-ghost">
          ← BACK TO DASHBOARD
        </Link>

        {step === "pick" && (
          <div className="mt-5">
            <h1 className="display text-[26px] mb-1">Log practice</h1>
            <p className="text-sm mb-6" style={{ color: "var(--ink-faint)" }}>
              Which skill did you work on?
            </p>

            {skills.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
                  No skills yet.{" "}
                  <Link href="/dashboard/skills/new" style={{ color: "var(--amber-dim)" }}>
                    Add one first
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {skills.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => chooseSkill(s.id)}
                    className="card card-tab-sm text-left transition-colors hover:brightness-110"
                    style={{ "--tab-color": s.color } as React.CSSProperties}
                  >
                    <div className="chip mb-2" style={{ backgroundColor: s.color }}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="label-head text-[14px]">{s.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "details" && selectedSkill && (
          <div className="mt-5">
            <h1 className="display text-[26px] mb-1">Log practice</h1>
            <div className="flex items-center gap-2 mb-6">
              <div className="chip w-5 h-5 text-[10px]" style={{ backgroundColor: selectedSkill.color }}>
                {selectedSkill.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
                {selectedSkill.name}
              </p>
              <button type="button" onClick={() => setStep("pick")} className="btn-ghost ml-1">
                CHANGE
              </button>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4">
              <div>
                <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                  TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scales practice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                  style={inputStyle}
                />
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                    PROJECT (OPTIONAL)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                    HOURS
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                    MINUTES
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                    DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                  NOTES (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  placeholder="What did you focus on today?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                  style={inputStyle}
                />
              </div>

              {error && (
                <p className="text-sm" style={{ color: "#e08d8d" }}>
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Link href="/dashboard" className="btn-ghost">
                  CANCEL
                </Link>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Saving..." : "Log session"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LogPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 mono text-sm" style={{ color: "var(--ink-faint)" }}>
          Loading...
        </div>
      }
    >
      <LogPracticeContent />
    </Suspense>
  );
}