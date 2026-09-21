"use client";

import { useEffect, useState } from "react";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectModalProps {
  isOpen: boolean;
  skillId: string;
  project?: ProjectData | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

export default function ProjectModal({
  isOpen,
  skillId,
  project,
  onClose,
  onSaved,
}: ProjectModalProps) {
  const isEdit = !!project;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(project?.name || "");
    setDescription(project?.description || "");
    setError(null);
  }, [isOpen, project]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = isEdit
        ? `/api/skills/${skillId}/projects/${project!.id}`
        : `/api/skills/${skillId}/projects`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save project.");
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
          {isEdit ? "Edit Project" : "New Project"}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-faint)" }}>
          {isEdit ? "Update this project's details." : "Group related practice sessions together."}
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
              PROJECT NAME
            </label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g., Bach's Bourrée in E Minor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
              DESCRIPTION (OPTIONAL)
            </label>
            <textarea
              rows={3}
              placeholder="What are you working on?"
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
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}