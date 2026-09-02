"use client";

import { useState, useMemo } from "react";

interface PracticeSession {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  date: string;
  skill: {
    name: string;
    color: string;
  };
}

interface CalendarGridProps {
  sessions: PracticeSession[];
}

export default function CalendarGrid({ sessions }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate array of past 112 days (16 weeks) ending today
  const days = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 111; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, []);

  // Group sessions by date string YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map: Record<string, PracticeSession[]> = {};
    sessions.forEach((s) => {
      const dateKey = new Date(s.date).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return map;
  }, [sessions]);

  // Calculate background color based on total minutes in a day
  const getIntensityClass = (dateStr: string) => {
    const daySessions = sessionsByDate[dateStr] || [];
    const totalMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    if (totalMins === 0) return "bg-gray-100 hover:bg-gray-200";
    if (totalMins < 30) return "bg-emerald-200 hover:bg-emerald-300";
    if (totalMins < 60) return "bg-emerald-400 hover:bg-emerald-500";
    return "bg-emerald-600 hover:bg-emerald-700";
  };

  const activeSessions = selectedDate ? sessionsByDate[selectedDate] || [] : [];

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Activity Grid</h3>
        <p className="text-sm text-gray-500">Practice history for the past 16 weeks</p>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
          {days.map((dateStr) => {
            const hasActivity = !!sessionsByDate[dateStr]?.length;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                title={`${dateStr}: ${
                  sessionsByDate[dateStr]?.reduce((a, b) => a + b.durationMinutes, 0) || 0
                } mins`}
                className={`w-4 h-4 rounded-sm transition-all ${getIntensityClass(
                  dateStr
                )} ${isSelected ? "ring-2 ring-black ring-offset-1 scale-110" : ""}`}
              />
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Sessions on {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: "full" })}
          </h4>

          {activeSessions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No practice sessions logged for this day.</p>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-3 border rounded-lg bg-gray-50 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: session.skill.color }}
                      />
                      <span className="font-medium text-sm">{session.skill.name}</span>
                      <span className="text-sm text-gray-600">— {session.title}</span>
                    </div>
                    {session.description && (
                      <p className="text-xs text-gray-500 mt-1">{session.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-white border rounded">
                    {session.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}