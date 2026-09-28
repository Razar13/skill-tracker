"use client";

import { useEffect, useState } from "react";

interface SkillOption {
  id: string;
  name: string;
}

interface ImportDataModalProps {
  isOpen: boolean;
  targetSkillId: string;
  targetSkillName: string;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportDataModal({
  isOpen,
  targetSkillId,
  targetSkillName,
  onClose,
  onImported,
}: ImportDataModalProps) {
  const [mode, setMode] = useState<"file" | "skill">("file");
  const [file, setFile] = useState<File | null>(null);
  const [sourceSkillId, setSourceSkillId] = useState("");
  const [otherSkills, setOtherSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setSourceSkillId("");
    setError("");
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { id: string; name: string }[]) =>
        setOtherSkills(data.filter((s) => s.id !== targetSkillId))
      );
  }, [isOpen, targetSkillId]);

  if (!isOpen) return null;

  async function handleImport() {
    setError("");

    let payload: any;
    if (mode === "file") {
      if (!file) {
        setError("Choose a file to import.");
        return;
      }
      try {
        const text = await file.text();
        payload = { source: "file", data: JSON.parse(text) };
      } catch {
        setError("That file isn't valid JSON.");
        return;
      }
    } else {
      if (!sourceSkillId) {
        setError("Choose a skill to copy from.");
        return;
      }
      payload = { source: "skill", sourceSkillId };
    }
    payload.target = { mode: "existing", skillId: targetSkillId };

    setLoading(true);
    const res = await fetch("/api/skills/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Import failed.");
      return;
    }

    onImported();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="display text-xl mb-1">Import into {targetSkillName}</h2>
        <p className="text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
          Sessions and projects will be added to this skill's existing data — nothing gets replaced.
        </p>

        {error && (
          <div
            className="p-3 mb-4 text-sm rounded"
            style={{ background: "rgba(198,102,102,0.1)", border: "1px solid rgba(198,102,102,0.4)", color: "#e08d8d" }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-4 text-sm mb-4" style={{ color: "var(--ink-dim)" }}>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "file"} onChange={() => setMode("file")} />
            JSON file
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "skill"} onChange={() => setMode("skill")} />
            Another skill I have
          </label>
        </div>

        {mode === "file" ? (
          <input
            type="file"
            accept="application/json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm mb-4"
            style={{ color: "var(--ink-dim)" }}
          />
        ) : (
          <select
            value={sourceSkillId}
            onChange={(e) => setSourceSkillId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg mb-4 focus:outline-none"
            style={{ background: "var(--card-raised)", border: "1px solid var(--rule)", color: "var(--ink)" }}
          >
            <option value="">Select a skill…</option>
            {otherSkills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            CANCEL
          </button>
          <button type="button" onClick={handleImport} disabled={loading} className="btn-primary">
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}