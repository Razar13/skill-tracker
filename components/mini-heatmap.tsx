"use client";

import { useMemo } from "react";
import { getHeatmapCellColor } from "@/lib/heatmap-colors";

interface PracticeSession {
  durationMinutes: number;
  date: string;
}

interface MiniHeatmapProps {
  sessions: PracticeSession[];
}

export default function MiniHeatmap({ sessions }: MiniHeatmapProps) {
  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = new Date(s.date).toISOString().split("T")[0];
      map[key] = (map[key] || 0) + s.durationMinutes;
    });
    return map;
  }, [sessions]);

  const days = useMemo(() => {
    const arr: { dateStr: string; minutes: number }[] = [];
    const today = new Date();
    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      arr.push({ dateStr, minutes: sessionsByDate[dateStr] || 0 });
    }
    return arr;
  }, [sessionsByDate]);

  const allMinutes = useMemo(() => days.map((d) => d.minutes), [days]);

  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((day) => {
        const color = getHeatmapCellColor(day.minutes, allMinutes);
        return (
          <div
            key={day.dateStr}
            title={`${day.dateStr}: ${day.minutes} mins`}
            className={`aspect-square rounded-[2px] transition-colors ${
              color ? "hover:ring-1 hover:ring-zinc-400" : "bg-zinc-800/60 hover:bg-zinc-700/80"
            }`}
            style={color ? { backgroundColor: color } : undefined}
          />
        );
      })}
    </div>
  );
}