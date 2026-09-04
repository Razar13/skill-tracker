"use client";

import { useMemo } from "react";

interface PracticeSession {
  durationMinutes: number;
  date: string;
}

interface SkillHeatmapProps {
  sessions: PracticeSession[];
  weeks?: number;
}

export default function SkillHeatmap({ sessions, weeks = 26 }: SkillHeatmapProps) {
  const { days, months } = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(start.getDate() - dayOfWeek - (weeks - 1) * 7);

    const dates: ({ dateStr: string; isFuture: boolean } | null)[] = [];
    const monthLabels: { label: string; index: number }[] = [];
    let lastMonth = -1;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const current = new Date(d);
      const dateStr = current.toISOString().split("T")[0];
      const isFuture = current > today;
      dates.push({ dateStr, isFuture });

      if (current.getDate() === 1 || dates.length === 1) {
        const colIndex = Math.floor((dates.length - 1) / 7);
        if (current.getMonth() !== lastMonth) {
          monthLabels.push({
            label: current.toLocaleString("en-US", { month: "short" }),
            index: colIndex,
          });
          lastMonth = current.getMonth();
        }
      }
    }
    return { days: dates, months: monthLabels };
  }, [weeks]);

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

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="min-w-max">
          <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
            {days.map((day, i) => {
              if (!day || day.isFuture) {
                return (
                  <div
                    key={day ? day.dateStr : `pad-${i}`}
                    className="w-3.5 h-3.5 bg-transparent"
                  />
                );
              }
              const totalMins = sessionsByDate[day.dateStr] || 0;
              return (
                <div
                  key={day.dateStr}
                  title={`${day.dateStr}: ${totalMins} mins`}
                  className={`w-3.5 h-3.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-zinc-400 ${getIntensityClass(
                    totalMins
                  )}`}
                />
              );
            })}
          </div>
          <div className="flex relative w-full h-4 mt-3">
            {months.map((m, i) => (
              <span
                key={i}
                className="absolute text-[11px] text-zinc-500 font-medium tracking-wide"
                style={{ left: `${m.index * 17}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}