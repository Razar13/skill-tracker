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
      <div className="bg-[#18181A] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-1">
          {isEdit ? "Edit Practice Session" : "Log Practice Session"}
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          {isEdit ? "Update the details of this session." : "Track what you worked on today."}
        </p>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-300">Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Scales practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">Hours</label>
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) =>
                  setMinutes(Math.min(59, Math.max(0, Number(e.target.value))))
                }
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-300">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What did you focus on today?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}