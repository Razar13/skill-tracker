"use client";

import { useState } from "react";
import { downloadJson } from "@/lib/export-import";

interface SkillOption {
  id: string;
  name: string;
  color: string;
}

interface ExportSkillsModalProps {
  isOpen: boolean;
  skills: SkillOption[];
  onClose: () => void;
}

export default function ExportSkillsModal({ isOpen, skills, onClose }: ExportSkillsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allSelected = selected.size === skills.length && skills.length > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(skills.map((s) => s.id)));
  }

  async function handleExport() {
    if (selected.size === 0) {
      setError("Select at least one skill.");
      return;
    }
    setError(null);
    setIsExporting(true);
    try {
      const ids = Array.from(selected).join(",");
      const res = await fetch(`/api/skills/export?ids=${ids}`);
      if (!res.ok) throw new Error("Export failed.");
      const data = await res.json();
      downloadJson("skill-tracker-export.json", data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card max-w-md w-full">
        <h2 className="display text-xl mb-1">Export skills</h2>
        <p className="text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
          Choose which skills to include in the JSON export.
        </p>

        {error && (
          <div
            className="p-3 mb-4 text-sm rounded"
            style={{ background: "rgba(198,102,102,0.1)", border: "1px solid rgba(198,102,102,0.4)", color: "#e08d8d" }}
          >
            {error}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm py-1.5 mb-1" style={{ color: "var(--ink-dim)" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select all
        </label>

        <div className="max-h-64 overflow-y-auto mb-4" style={{ borderTop: "1px dashed var(--rule)" }}>
          {skills.map((s) => (
            <label key={s.id} className="row-rule flex items-center gap-2 text-sm py-2">
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
              <span className="chip w-5 h-5 text-[10px]" style={{ backgroundColor: s.color }}>
                {s.name.charAt(0).toUpperCase()}
              </span>
              {s.name}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            CANCEL
          </button>
          <button type="button" onClick={handleExport} disabled={isExporting} className="btn-primary">
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}