"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Skill {
  id: string;
  name: string;
  color: string;
}

function LogPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("skillId");

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [skillId, setSkillId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/skills");
        if (res.ok) setSkills(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (preselectedId && skills.some((s) => s.id === preselectedId)) {
      setSkillId(preselectedId);
      setStep("details");
    }
  }, [preselectedId, skills]);

  const selectedSkill = useMemo(
    () => skills.find((s) => s.id === skillId) || null,
    [skills, skillId]
  );

  function chooseSkill(id: string) {
    setSkillId(id);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const totalMinutes = hours * 60 + minutes;
    if (!skillId) {
      setError("Choose a skill first.");
      return;
    }
    if (!title.trim()) {
      setError("Give the session a title.");
      return;
    }
    if (totalMinutes <= 0) {
      setError("Duration must be more than 0 minutes.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skillId,
        title: title.trim(),
        description: description.trim(),
        durationMinutes: totalMinutes,
        date,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Couldn't log the session.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return <div className="p-8 text-zinc-400 bg-[#121212] min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#121212] text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to dashboard
        </Link>

        {step === "pick" && (
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white mb-1">Log practice</h1>
            <p className="text-sm text-zinc-500 mb-6">Which skill did you work on?</p>

            {skills.length === 0 ? (
              <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 text-center text-zinc-500 text-sm">
                No skills yet.{" "}
                <Link href="/dashboard/skills/new" className="text-amber-500 hover:text-amber-400">
                  Add one first
                </Link>
                .
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {skills.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => chooseSkill(s.id)}
                    className="bg-[#18181A] border border-zinc-800/50 hover:border-zinc-700 rounded-xl p-4 text-left transition-colors"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: s.color }}
                    />
                    <p className="font-medium text-zinc-100 text-sm">{s.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "details" && selectedSkill && (
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white mb-1">Log practice</h1>
            <div className="flex items-center gap-2 mb-6">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedSkill.color }}
              />
              <p className="text-sm text-zinc-400">{selectedSkill.name}</p>
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="text-xs text-amber-500 hover:text-amber-400 ml-1"
              >
                Change
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1.5 text-zinc-300">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scales practice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">Hours</label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-300">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-zinc-300">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="What did you focus on today?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Link href="/dashboard" className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Log session"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LogPracticePage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400 bg-[#121212] min-h-screen">Loading...</div>}>
      <LogPracticeContent />
    </Suspense>
  );
}