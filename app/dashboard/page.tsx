"use client";

import { useEffect, useState } from "react";

interface Skill {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  totalMinutes: number;
}

export default function DashboardPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("/api/skills");
        if (!res.ok) {
          throw new Error("Failed to fetch skills");
        }
        const data = await res.json();
        setSkills(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading skills: {error}</div>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Skills</h1>

      {skills.length === 0 ? (
        <p className="text-gray-500">No skills found. Add your first skill to start tracking!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="p-4 rounded-lg border shadow-sm"
              style={{ borderLeft: `6px solid ${skill.color}` }}
            >
              <h2 className="text-xl font-semibold">{skill.name}</h2>
              <p className="text-sm text-gray-600">Sessions: {skill.sessionCount}</p>
              <p className="text-sm text-gray-600">Total Time: {skill.totalMinutes} mins</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}