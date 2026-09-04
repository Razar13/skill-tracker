"use client";

import { useMemo } from "react";

interface PracticeSession {
  id: string;
  durationMinutes: number;
  date: string;
}

interface CalendarGridProps {
  sessions: PracticeSession[];
}

export default function CalendarGrid({ sessions }: CalendarGridProps) {
  const currentYear = new Date().getFullYear();

  // Generate a full calendar year (Jan 1 to Dec 31)
  const { days, months } = useMemo(() => {
    const dates: ({ dateStr: string; isFuture: boolean } | null)[] = [];
    const monthLabels: { label: string; index: number }[] = [];
    
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31);
    
    // Set 'today' to the very end of the current day to ensure today is not marked as future
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Pad the start so the first day maps correctly to the day of the week (Mon = 0)
    let startDay = start.getDay() === 0 ? 6 : start.getDay() - 1;
    for (let i = 0; i < startDay; i++) {
      dates.push(null);
    }

    let lastMonth = -1;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split("T")[0];
      const isFuture = d > today;
      dates.push({ dateStr, isFuture });

      if (d.getDate() === 1) {
        // Calculate the column index (each column is 7 days)
        const colIndex = Math.floor((dates.length - 1) / 7);
        if (d.getMonth() !== lastMonth) {
          monthLabels.push({
            label: d.toLocaleString('en-US', { month: 'short' }),
            index: colIndex
          });
          lastMonth = d.getMonth();
        }
      }
    }
    return { days: dates, months: monthLabels };
  }, [currentYear]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const dateKey = new Date(s.date).toISOString().split("T")[0];
      map[dateKey] = (map[dateKey] || 0) + s.durationMinutes;
    });
    return map;
  }, [sessions]);

  // Exact color matching for the mockup's amber gradient
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
        <h3 className="text-lg font-bold text-white tracking-wide">Practice Activity</h3>
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

      {/* Grid container */}
      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="min-w-max">
          
          {/* 7-Row Daily Grid */}
          <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
            {days.map((day, i) => {
              // Padding blocks for the start of the year
              if (!day) {
                return <div key={`pad-${i}`} className="w-3.5 h-3.5 bg-transparent" />;
              }
              
              // Future days render as completely empty, invisible blocks
              if (day.isFuture) {
                return <div key={day.dateStr} className="w-3.5 h-3.5 bg-transparent" />;
              }

              // Past and current days
              const totalMins = sessionsByDate[day.dateStr] || 0;
              return (
                <div
                  key={day.dateStr}
                  title={`${day.dateStr}: ${totalMins} mins`}
                  className={`w-3.5 h-3.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-zinc-400 ${getIntensityClass(totalMins)}`}
                />
              );
            })}
          </div>

          {/* Month Labels aligned underneath the grid columns */}
          <div className="flex relative w-full h-4 mt-3">
            {months.map((m, i) => (
              <span 
                key={i} 
                className="absolute text-[11px] text-zinc-500 font-medium tracking-wide"
                style={{ left: `${m.index * 17}px` }} // 14px square width + 3px gap = 17px
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