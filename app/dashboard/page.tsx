"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AddSkillModal from "@/components/add-skill-modal";
import LogPracticeModal from "@/components/log-practice-modal";
import CalendarGrid from "@/components/calendar-grid";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    } catch (err) {
      console.error("Failed loading skills:", err);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed loading sessions:", err);
    }
  }, []);

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill and all its practice logs?")) return;

    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Refresh skills and calendar after deletion
        fetchSkills();
        fetchSessions();
      }
    } catch (err) {
      console.error("Failed to delete skill:", err);
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchSkills(), fetchSessions()]);
      setLoading(false);
    }
    init();
  }, [fetchSkills, fetchSessions]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  const handleSkillAdded = (newSkill: Skill) => {
    setSkills((prev) => [newSkill, ...prev]);
  };

  const handleSessionLogged = () => {
    fetchSkills();
    fetchSessions();
  };

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex justify-between items-center pb-4 border-b">
        <h1 className="text-2xl font-bold">Skill Tracker</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/stats"
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
          >
            📊 Statistics
          </Link>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Overview</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsLogPracticeOpen(true)}
            disabled={skills.length === 0}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm disabled:opacity-50"
          >
            + Log Practice
          </button>
          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            + Add Skill
          </button>
        </div>
      </div>

      {/* Calendar Heatmap Grid */}
      <CalendarGrid sessions={sessions} />

      {/* Skills list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Skills</h2>
        {skills.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <p className="text-gray-500 mb-4">No skills tracked yet.</p>
            <button
              onClick={() => setIsAddSkillOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Create your first skill
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 rounded-xl border bg-white shadow-sm flex justify-between items-start"
                style={{ borderLeft: `6px solid ${skill.color}` }}
              >
                <div>
                  <h3 className="text-lg font-semibold">{skill.name}</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Sessions: {skill.sessionCount}</p>
                    <p>Total time: {skill.totalMinutes} mins</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSkillModal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        onSkillAdded={handleSkillAdded}
      />

      <LogPracticeModal
        isOpen={isLogPracticeOpen}
        skills={skills}
        onClose={() => setIsLogPracticeOpen(false)}
        onSessionLogged={handleSessionLogged}
      />
    </main>
  );
}