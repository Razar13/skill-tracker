"use client";

import { useState } from "react";

interface CreateProjectModalProps {
  isOpen: boolean;
  skillId: string;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function CreateProjectModal({
  isOpen,
  skillId,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/skills/${skillId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      setName("");
      setDescription("");
      onProjectCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">New Project</h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/40 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">Project Name</label>
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g., Bach's Bourrée in E Minor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-300">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}