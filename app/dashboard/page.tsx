"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AddSkillModal from "@/components/add-skill-modal";
import LogPracticeModal from "@/components/log-practice-modal";

interface Skill {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  totalMinutes: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

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

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <h1 className="text-2xl font-bold">Skill Tracker</h1>
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? "Disconnecting..." : "Disconnect"}
        </button>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Skills</h2>
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

      {/* Skills list */}
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
              className="p-4 rounded-xl border bg-white shadow-sm"
              style={{ borderLeft: `6px solid ${skill.color}` }}
            >
              <h3 className="text-lg font-semibold">{skill.name}</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Sessions: {skill.sessionCount}</p>
                <p>Total time: {skill.totalMinutes} mins</p>
              </div>
            </div>
          ))}
        </div>
      )}

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
        onSessionLogged={fetchSkills}
      />
    </main>
  );
}