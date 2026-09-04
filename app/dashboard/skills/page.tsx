"use client";

import { useEffect, useState, useCallback } from "react";
import AddSkillModal from "@/components/add-skill-modal";
import Link from "next/link";

interface Skill {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  totalMinutes: number;
}

interface PracticeSession {
  id: string;
  skillId: string;
  durationMinutes: number;
  date: string;
}

export default function MySkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) setSkills(await res.json());
    } catch (err) {
      console.error("Failed loading skills:", err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setSessions(await res.json());
    } catch (err) {
      console.error("Failed loading sessions:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([fetchSkills(), fetchSessions()]);
      setLoading(false);
    }
    init();
  }, [fetchSkills, fetchSessions]);

  // Reused streak calculator from your stats logic
  const calculateStreak = (skillSessions: PracticeSession[]) => {
    if (!skillSessions.length) return 0;
    const uniqueDates = Array.from(
      new Set(skillSessions.map((s) => new Date(s.date).toISOString().split("T")[0]))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toISOString().split("T")[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    let current = 0;
    const hasToday = uniqueDates.includes(today);
    const hasYesterday = uniqueDates.includes(yesterday);

    if (hasToday || hasYesterday) {
      let checkDate = new Date(hasToday ? today : yesterday);
      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (uniqueDates.includes(dateStr)) {
          current++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else break;
      }
    }
    return current;
  };

  const getSkillLevel = (totalMinutes: number) => {
    const hours = totalMinutes / 60;
    if (hours >= 50) return { label: "Advanced", color: "text-amber-600" };
    if (hours >= 20) return { label: "Intermediate", color: "text-amber-500" };
    return { label: "Beginner", color: "text-blue-500" };
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading skills...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Skills</h1>
          <p className="text-sm text-zinc-500">
            Grow your musicianship. Keep your practice focused and consistent.
          </p>
        </div>
        <button
          onClick={() => setIsAddSkillOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-lg transition-colors"
        >
          + Add New Skill
        </button>
      </div>

      {/* Skills Grid */}
      {skills.length === 0 ? (
        <div className="text-center py-20 border border-zinc-800/50 rounded-xl bg-[#18181A]">
          <p className="text-zinc-500 mb-4">No skills tracked yet.</p>
          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg"
          >
            Create your first skill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => {
            const skillSessions = sessions.filter(s => s.skillId === skill.id);
            const streak = calculateStreak(skillSessions);
            const hours = Math.floor(skill.totalMinutes / 60);
            const level = getSkillLevel(skill.totalMinutes);

            return (
              <div 
                key={skill.id} 
                className="bg-[#18181A] border border-zinc-800/50 rounded-xl overflow-hidden flex flex-col transition-all hover:border-zinc-700"
              >
                {/* Mock Image Banner - Uses a subtle gradient based on skill color */}
                <div 
                  className="h-36 w-full opacity-80"
                  style={{
                    background: `linear-gradient(135deg, ${skill.color}40 0%, #121212 100%)`,
                    borderBottom: `2px solid ${skill.color}`
                  }}
                />

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${level.color}`}>
                    {level.label}
                  </span>
                  
                  <h2 className="text-xl font-bold text-white mb-6">{skill.name}</h2>
                  
                  <div className="flex justify-between items-center text-sm text-zinc-400 mb-6">
                    <div className="flex items-center gap-2">
                      <span>⏳</span>
                      <span>{hours} hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">🔥</span>
                      <span className="text-amber-500">{streak} days</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-800/50">
                    <Link
                      href={`/dashboard/skills/${skill.id}`}
                      className="text-amber-500 text-sm font-medium hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                      View Details <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddSkillModal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        onSkillAdded={() => fetchSkills()}
      />
    </div>
  );
}