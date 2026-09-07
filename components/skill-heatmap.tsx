"use client";

import { useMemo } from "react";
import { getHeatmapCellColor } from "@/lib/heatmap-colors";

interface PracticeSession {
  id?: string;
  durationMinutes: number;
  date: string;
}

interface SkillHeatmapProps {
  sessions: PracticeSession[];
}

interface DayCell {
  dateStr: string;
  isFuture: boolean;
}

export default function SkillHeatmap({ sessions }: SkillHeatmapProps) {
  const currentYear = new Date().getFullYear();

  const { days, months, weeksCount } = useMemo(() => {
    const dates: (DayCell | null)[] = [];
    const monthLabels: { label: string; week: number }[] = [];

    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDay = start.getDay() === 0 ? 6 : start.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
      dates.push(null);
    }

    let lastMonth = -1;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      const isFuture = d > today;
      dates.push({ dateStr, isFuture });

      if (d.getMonth() !== lastMonth) {
        const week = Math.floor((dates.length - 1) / 7);
        monthLabels.push({
          label: d.toLocaleString("en-US", { month: "short" }),
          week,
        });
        lastMonth = d.getMonth();
      }
    }

    while (dates.length % 7 !== 0) {
      dates.push(null);
    }

    return {
      days: dates,
      months: monthLabels,
      weeksCount: dates.length / 7,
    };
  }, [currentYear]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const dateKey = new Date(s.date).toISOString().split("T")[0];
      map[dateKey] = (map[dateKey] || 0) + s.durationMinutes;
    });
    return map;
  }, [sessions]);

  const allMinutes = useMemo(() => {
    return days
      .filter((d): d is DayCell => !!d && !d.isFuture)
      .map((d) => sessionsByDate[d.dateStr] || 0);
  }, [days, sessionsByDate]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-lg font-bold text-white tracking-wide">Practice Consistency</h3>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <span>Less</span>
          <div className="flex gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-zinc-800/60" />
            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: "#4A2F14" }} />
            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: "#8A5A19" }} />
            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: "#F0A828" }} />
            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: "#FFCB4D" }} />
          </div>
          <span>More</span>
        </div>
      </div>

      <div
        className="grid w-full gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${weeksCount}, minmax(0, 1fr))`,
          gridTemplateRows: "auto repeat(7, 1fr)",
        }}
      >
        {months.map((m) => (
          <span
            key={`${m.label}-${m.week}`}
            className="text-[11px] text-zinc-500 font-medium tracking-wide mb-1"
            style={{ gridColumn: m.week + 1, gridRow: 1 }}
          >
            {m.label}
          </span>
        ))}

        {days.map((day, i) => {
          const week = Math.floor(i / 7) + 1;
          const weekday = (i % 7) + 2;

          if (!day || day.isFuture) {
            return (
              <div
                key={day ? day.dateStr : `pad-${i}`}
                style={{ gridColumn: week, gridRow: weekday }}
              />
            );
          }

          const totalMins = sessionsByDate[day.dateStr] || 0;
          const color = getHeatmapCellColor(totalMins, allMinutes);

          return (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${totalMins} mins`}
              style={{ gridColumn: week, gridRow: weekday, ...(color ? { backgroundColor: color } : {}) }}
              className={`aspect-square rounded-[2px] transition-colors hover:ring-1 hover:ring-zinc-400 ${
                color ? "" : "bg-zinc-800/60 hover:bg-zinc-700/80"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}