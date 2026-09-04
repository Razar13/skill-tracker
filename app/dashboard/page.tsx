"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AddSkillModal from "@/components/add-skill-modal";
import LogPracticeModal from "@/components/log-practice-modal";
import CalendarGrid from "@/components/calendar-grid";

interface Skill {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  totalMinutes: number;
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isLogPracticeOpen, setIsLogPracticeOpen] = useState(false);

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

  const metrics = useMemo(() => {
    const totalMins = skills.reduce((acc, skill) => acc + skill.totalMinutes, 0);
    const totalHours = Math.floor(totalMins / 60);
    const remainderMins = totalMins % 60;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const sessionsThisWeek = sessions.filter(s => new Date(s.date) >= startOfWeek);

    return {
      totalTime: `${totalHours}h ${remainderMins}m`,
      skillsTracked: skills.length,
      weeklyLogs: sessionsThisWeek.length,
    };
  }, [skills, sessions]);

  if (loading) return <div className="p-8 text-zinc-400 bg-[#121212] min-h-screen">Loading dashboard...</div>;

  return (
    <main className="text-zinc-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="space-y-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Good evening, Alex</h1>
          <p className="text-sm text-zinc-500">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — "The beautiful thing about learning is nobody can take it away from you." — B.B. King
          </p>
        </header>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
            <div className="flex justify-between items-start text-zinc-500 mb-2">
              <span className="text-xs font-medium">Total Practice Time</span>
              <span className="text-amber-500">⏳</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metrics.totalTime}</div>
            <div className="text-xs text-zinc-600">+8.5h logged this week</div>
          </div>
          
          <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
            <div className="flex justify-between items-start text-zinc-500 mb-2">
              <span className="text-xs font-medium">Current Streak</span>
              <span className="text-amber-500">🔥</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">12 days</div>
            <div className="text-xs text-zinc-600">Flame stays glowing!</div>
          </div>

          <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
            <div className="flex justify-between items-start text-zinc-500 mb-2">
              <span className="text-xs font-medium">Skills Tracked</span>
              <span className="text-amber-500">📊</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metrics.skillsTracked} Instruments</div>
            <div className="text-xs text-zinc-600">Active focus across 3</div>
          </div>

          <div className="bg-[#18181A] p-5 rounded-xl border border-zinc-800/50">
            <div className="flex justify-between items-start text-zinc-500 mb-2">
              <span className="text-xs font-medium">Sessions This Week</span>
              <span className="text-amber-500">📅</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metrics.weeklyLogs} logs</div>
            <div className="text-xs text-zinc-600">Target goal is 10</div>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6">
           <CalendarGrid sessions={sessions} />
        </div>

        {/* Split Section: My Skills & Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* My Skills List */}
          <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">My Skills</h2>
              <button
                onClick={() => setIsAddSkillOpen(true)}
                className="px-3 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded transition-colors"
              >
                + Add New Skill
              </button>
            </div>

            <div className="space-y-6">
              {skills.map((skill) => {
                const hours = Math.floor(skill.totalMinutes / 60);
                const progress = Math.min(100, Math.max(10, (skill.totalMinutes / 6000) * 100));
                
                return (
                  <div key={skill.id}>
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-zinc-100 text-sm">{skill.name}</span>
                        <span className="text-[10px] text-zinc-500">Intermediate</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-zinc-400 block">{hours}h <span className="text-amber-500 ml-1">🔥 5 days</span></span>
                        </div>
                        <button 
                          onClick={() => setIsLogPracticeOpen(true)}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded transition-colors"
                        >
                          Practice Now
                        </button>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#F59E0B' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Sessions List */}
          <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Recent Sessions</h2>
              <button
                onClick={() => setIsLogPracticeOpen(true)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded transition-colors"
              >
                Log New Session
              </button>
            </div>

            <div className="space-y-4">
              {sessions.slice(0, 4).map((session) => (
                <div key={session.id} className="flex justify-between items-start border-b border-zinc-800/50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">
                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-bold text-zinc-200 text-sm">{session.skill.name}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{session.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-amber-500">{session.durationMinutes}m</span>
                    <span className="text-amber-500 text-[10px]">☆☆☆☆☆</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Progress Bar Chart */}
        <div className="bg-[#18181A] rounded-xl border border-zinc-800/50 p-6 h-64 flex flex-col justify-between">
            <h2 className="text-lg font-bold text-white mb-4">Weekly Progress (Practice Minutes)</h2>
            <div className="flex justify-around items-end h-full pt-4 border-t border-zinc-800/50">
              {[
                { day: 'Mon', val: 45, h: '35%' },
                { day: 'Tue', val: 75, h: '60%' },
                { day: 'Wed', val: 30, h: '25%' },
                { day: 'Thu', val: 90, h: '75%' },
                { day: 'Fri', val: 60, h: '50%' },
                { day: 'Sat', val: 120, h: '100%' },
                { day: 'Sun', val: 80, h: '65%' }
              ].map(bar => (
                <div key={bar.day} className="flex flex-col items-center gap-2 w-full">
                  {/* Fixed height container for the bar */}
                  <div className="h-24 flex items-end w-4">
                    <div className="w-full bg-amber-500 rounded-sm transition-all" style={{ height: bar.h }}></div>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] text-zinc-300 font-bold">{bar.val}m</span>
                    <span className="block text-[10px] text-zinc-500">{bar.day}</span>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>

      <AddSkillModal isOpen={isAddSkillOpen} onClose={() => setIsAddSkillOpen(false)} onSkillAdded={() => { fetchSkills(); }} />
      <LogPracticeModal isOpen={isLogPracticeOpen} skills={skills} onClose={() => setIsLogPracticeOpen(false)} onSessionLogged={() => { fetchSkills(); fetchSessions(); }} />
    </main>
  );
}