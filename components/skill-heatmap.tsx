"use client";

import { useMemo } from "react";

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

    // Pad so Jan 1 lands in the correct weekday row (Mon = 0 ... Sun = 6)
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

    // Pad the end so the final column is a full week too — this is what
    // guarantees December's column reaches all the way to the right edge.
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

  const getIntensityClass = (totalMins: number) => {
    if (totalMins === 0) return "bg-zinc-800/60 hover:bg-zinc-700/80";
    if (totalMins < 30) return "bg-[#5A3F1E] hover:bg-[#6D4C24]";
    if (totalMins < 60) return "bg-[#8A5A19] hover:bg-[#9F681C]";
    if (totalMins < 90) return "bg-[#C48024] hover:bg-[#DA8F28]";
    return "bg-[#F5A524] hover:bg-[#F6B141]";
  };

  return (
    <div className="w-full">
      {/* Header and Color Legend */}
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-lg font-bold text-white tracking-wide">Practice Consistency</h3>
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <span>Less</span>
          <div className="flex gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-zinc-800/60" />
            <span className="w-3.5 h-3.5 rounded-sm bg-[#5A3F1E]" />
            <span className="w-3.5 h-3.5 rounded-sm bg-[#8A5A19]" />
            <span className="w-3.5 h-3.5 rounded-sm bg-[#C48024]" />
            <span className="w-3.5 h-3.5 rounded-sm bg-[#F5A524]" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/*
        One shared grid for month labels + day cells, so they're always
        pixel-aligned. Columns are fractional (1fr each) instead of a fixed
        px width, so the whole heatmap stretches to fill the card and the
        last column (December) always sits flush against the right edge.
      */}
      <div
        className="grid w-full gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${weeksCount}, minmax(0, 1fr))`,
          gridTemplateRows: "auto repeat(7, 1fr)",
        }}
      >
        {/* Month labels */}
        {months.map((m) => (
          <span
            key={`${m.label}-${m.week}`}
            className="text-[11px] text-zinc-500 font-medium tracking-wide mb-1"
            style={{ gridColumn: m.week + 1, gridRow: 1 }}
          >
            {m.label}
          </span>
        ))}

        {/* Day cells */}
        {days.map((day, i) => {
          const week = Math.floor(i / 7) + 1;
          const weekday = (i % 7) + 2; // row 1 is reserved for month labels

          if (!day || day.isFuture) {
            return (
              <div
                key={day ? day.dateStr : `pad-${i}`}
                style={{ gridColumn: week, gridRow: weekday }}
              />
            );
          }

          const totalMins = sessionsByDate[day.dateStr] || 0;
          return (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${totalMins} mins`}
              style={{ gridColumn: week, gridRow: weekday }}
              className={`aspect-square rounded-[2px] transition-colors hover:ring-1 hover:ring-zinc-400 ${getIntensityClass(totalMins)}`}
            />
          );
        })}
      </div>
    </div>
  );
}