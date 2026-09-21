"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
}

interface SessionData {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  date: string;
  project: { id: string } | null;
}

interface SessionModalProps {
  isOpen: boolean;
  skillId: string;
  projects: Project[];
  session?: SessionData | null;
  onClose: () => void;
  onSaved: () => void;
}

function toDateInput(dateStr: string) {
  return new Date(dateStr).toISOString().split("T")[0];
}

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

export default function SessionModal({
  isOpen,
  skillId,
  projects,
  session,
  onClose,
  onSaved,
}: SessionModalProps) {
  const isEdit = !!session;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectId, setProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (session) {
      setTitle(session.title);
      setDescription(session.description || "");
      setHours(Math.floor(session.durationMinutes / 60));
      setMinutes(session.durationMinutes % 60);
      setDate(toDateInput(session.date));
      setProjectId(session.project?.id || "");
    } else {
      setTitle("");
      setDescription("");
      setHours(0);
      setMinutes(30);
      setDate(new Date().toISOString().split("T")[0]);
      setProjectId("");
    }
    setError(null);
  }, [isOpen, session]);

  if (!isOpen) return null;

  const totalMinutes = hours * 60 + minutes;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (totalMinutes <= 0) {
      setError("Duration must be more than 0 minutes.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/sessions/${session!.id}` : "/api/sessions";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId,
          projectId: projectId || null,
          title,
          description,
          durationMinutes: totalMinutes,
          date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save session.");
      }

      onSaved();
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
        <h2 className="display text-xl mb-1">
          {isEdit ? "Edit Practice Session" : "Log Practice Session"}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-faint)" }}>
          {isEdit ? "Update the details of this session." : "Track what you worked on today."}
        </p>

        {error && (
          <div
            className="p-3 mb-4 text-sm rounded"
            style={{ background: "rgba(198,102,102,0.1)", border: "1px solid rgba(198,102,102,0.4)", color: "#e08d8d" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={(e) =>
                  setMinutes(Math.min(59, Math.max(0, Number(e.target.value))))
                }
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
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}