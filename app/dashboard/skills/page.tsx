"use client";

import { useEffect, useState, useCallback } from "react";
import AddSkillModal from "@/components/add-skill-modal";
import Link from "next/link";
import { DashboardIcon } from "@/components/icon";
import SkillBanner from "@/components/skill-banner";
import { getCatalogImage } from "@/lib/skill-catalog";

interface Skill {
  id: string;
  name: string;
  color: string;
  level: string;
  sessionCount: number;
  totalMinutes: number;
}

interface PracticeSession {
  id: string;
  skillId: string;
  durationMinutes: number;
  date: string;
}

// Each level gets a fixed accent so "Beginner"/"Intermediate"/"Advanced"
// is recognizable as a color, not just a word — same idea as skill chips.
const LEVEL_COLORS: Record<string, string> = {
  Beginner: "#3b82f6",
  Intermediate: "#f0b13e",
  Advanced: "#a855f7",
};

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

  if (loading) {
    return (
      <div className="p-8 mono text-sm" style={{ color: "var(--ink-faint)" }}>
        Loading skills...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="display text-[28px] mb-1.5">My Skills</h1>
          <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
            Every skill here is a habit you&apos;re building — pick one up where you left off.
          </p>
        </div>
        <Link href="/dashboard/skills/new" className="btn-primary inline-block">
          + Add New Skill
        </Link>
      </div>

      {skills.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm mb-4" style={{ color: "var(--ink-faint)" }}>
            No skills tracked yet.
          </p>
          <Link href="/dashboard/skills/new" className="btn-primary inline-block">
            Create your first skill
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((skill) => {
            const skillSessions = sessions.filter((s) => s.skillId === skill.id);
            const streak = calculateStreak(skillSessions);
            const hours = Math.floor(skill.totalMinutes / 60);
            const levelColor = LEVEL_COLORS[skill.level] || LEVEL_COLORS.Beginner;

            return (
              <Link
                key={skill.id}
                href={`/dashboard/skills/${skill.id}`}
                className="card flex flex-col transition-colors hover:brightness-110"
                style={{ "--tab-color": skill.color } as React.CSSProperties}
              >
                <SkillBanner
                  name={skill.name}
                  color={skill.color}
                  imageUrl={skill.imageUrl ?? getCatalogImage(skill.name)}
                  size="card"
                />

                <div className="flex items-center justify-between mb-4">
                  <div
                    className="chip w-9 h-9 text-[15px]"
                    style={{ backgroundColor: skill.color }}
                  >
                    {skill.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="mono text-[10px] tracking-widest px-2 py-1 rounded-full border"
                    style={{ color: levelColor, borderColor: `${levelColor}55`, background: `${levelColor}18` }}
                  >
                    {skill.level.toUpperCase()}
                  </span>
                </div>

                <h2 className="display text-lg mb-5">{skill.name}</h2>

                <div className="flex items-center gap-2 mb-1.5 text-sm" style={{ color: "var(--ink-dim)" }}>
                  <DashboardIcon name="hourglass" className="w-4 h-4" />
                  <span className="mono">{hours}h logged</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--amber)" }}>
                  <span>🔥</span>
                  <span className="mono">{streak} day streak</span>
                </div>

                <div className="mt-auto pt-4" style={{ borderTop: "1px dashed var(--rule)" }}>
                  <span className="btn-ghost inline-block" style={{ color: "var(--amber-dim)" }}>
                    View details →
                  </span>
                </div>
              </Link>
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