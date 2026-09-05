"use client";

import { useState } from "react";

const LEVELS = [
  { key: "Beginner", color: "#3b82f6" },
  { key: "Intermediate", color: "#f59e0b" },
  { key: "Expert", color: "#a855f7" },
] as const;

interface LevelBadgePickerProps {
  level: string;
  onChange: (level: string) => void;
  disabled?: boolean;
}

export default function LevelBadgePicker({ level, onChange, disabled }: LevelBadgePickerProps) {
  const [open, setOpen] = useState(false);
  const current = LEVELS.find((l) => l.key === level) || LEVELS[0];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: `${current.color}22`,
          color: current.color,
          borderColor: `${current.color}55`,
        }}
      >
        {current.key} <span className="ml-0.5 opacity-70">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 bg-[#18181A] border border-zinc-800 rounded-lg shadow-xl py-1 min-w-[140px]">
            {LEVELS.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => {
                  onChange(l.key);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wide hover:bg-zinc-800/70 flex items-center gap-2"
                style={{ color: l.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                {l.key}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}