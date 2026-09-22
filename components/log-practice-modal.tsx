"use client";

import { useState } from "react";

interface Skill {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface LogPracticeModalProps {
  isOpen: boolean;
  skills: Skill[];
  projects?: Project[];
  lockedSkillId?: string;
  onClose: () => void;
  onSessionLogged: () => void;
}

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

export default function LogPracticeModal({
  isOpen,
  skills,
  projects = [],
  lockedSkillId,
  onClose,
  onSessionLogged,
}: LogPracticeModalProps) {
  const [skillId, setSkillId] = useState(lockedSkillId || skills[0]?.id || "");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const effectiveSkillId = lockedSkillId || skillId || skills[0]?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: effectiveSkillId,
          projectId: projectId || null,
          title,
          description,
          durationMinutes,
          date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log session");
      }

      setTitle("");
      setDescription("");
      setProjectId("");
      onSessionLogged();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="display text-xl mb-6">Log Practice Session</h2>

        {error && (
          <div
            className="p-3 mb-4 text-sm rounded"
            style={{ background: "rgba(198,102,102,0.1)", border: "1px solid rgba(198,102,102,0.4)", color: "#e08d8d" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!lockedSkillId && (
            <div>
              <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                SELECT SKILL
              </label>
              <select
                value={skillId || skills[0]?.id}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
                style={inputStyle}
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {lockedSkillId && projects.length > 0 && (
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

          <div>
            <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
              TITLE
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Vocabulary review / Scales practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                DURATION (MINS)
              </label>
              <input
                type="number"
                min={1}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
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

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!lockedSkillId && skills.length === 0)}
              className="btn-primary"
            >
              {isSubmitting ? "Saving..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}