"use client";

import { useState } from "react";

interface Skill {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  totalMinutes: number;
}

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded: (newSkill: Skill) => void;
}

const PRESET_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

export default function AddSkillModal({ isOpen, onClose, onSkillAdded }: AddSkillModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create skill");
      }

      const formattedSkill: Skill = {
        ...data,
        sessionCount: 0,
        totalMinutes: 0,
      };

      onSkillAdded(formattedSkill);
      setName("");
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full" style={{ "--tab-color": color } as React.CSSProperties}>
        <h2 className="display text-xl mb-6">Add New Skill</h2>

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
              SKILL NAME
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g., English, Piano, Programming"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="mono text-[11px] tracking-wide block mb-2" style={{ color: "var(--ink-dim)" }}>
              COLOR THEME
            </label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? "0 0 0 2px var(--card), 0 0 0 4px " + c : "none",
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-ghost">
              CANCEL
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Saving..." : "Add Skill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}