"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

// TODO: recentSessions / last30Days are still mock data, waiting on the
// "Log practice" feature and its API route. Skills below are real, fetched
// from /api/skills.

type Skill = {
  id: string;
  name: string;
  color: string; // hex, e.g. "#3b82f6"
  totalMinutes: number;
  sessionCount: number;
};

type PracticeSession = {
  id: string;
  skillName: string;
  skillColor: string;
  date: string; // e.g. "Sep 2"
  title: string;
  durationMinutes: number;
};

const recentSessions: PracticeSession[] = [
  { id: "1", skillName: "Classical guitar", skillColor: "bg-blue-500", date: "Sep 2", title: "Sor Study No. 5, slow tempo", durationMinutes: 45 },
  { id: "2", skillName: "Mandarin", skillColor: "bg-amber-500", date: "Sep 1", title: "Tone drills, chapter 4 vocab", durationMinutes: 30 },
  { id: "3", skillName: "Watercolor", skillColor: "bg-violet-500", date: "Aug 31", title: "Wet-on-wet skies", durationMinutes: 70 },
  { id: "4", skillName: "Classical guitar", skillColor: "bg-blue-500", date: "Aug 31", title: "Scales + repertoire review", durationMinutes: 50 },
  { id: "5", skillName: "Mandarin", skillColor: "bg-amber-500", date: "Aug 30", title: "Listening practice", durationMinutes: 20 },
];

// last 30 days, 0 = no practice, 1-3 = intensity
const last30Days = [
  2, 3, 0, 1, 2, 3, 1, 0, 2, 1, 3, 2, 1, 0, 3, 2, 1, 2, 3, 2, 0, 1, 2, 3, 2, 1,
  3, 2, 3, 3,
];

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(1);
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState("");

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function loadSkills() {
      setSkillsLoading(true);
      setSkillsError("");

      const res = await fetch("/api/skills");
      if (cancelled) return;

      if (!res.ok) {
        setSkillsError("Couldn't load your skills.");
        setSkillsLoading(false);
        return;
      }

      const data: Skill[] = await res.json();
      if (!cancelled) {
        setSkills(data);
        setSkillsLoading(false);
      }
    }

    loadSkills();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!isPending && !session?.user) {
    router.push("/login");
    return null;
  }

  const weekMinutes = recentSessions
    .filter((s) => ["Sep 2", "Sep 1", "Aug 31", "Aug 30"].includes(s.date))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const currentStreak = 12;
  const bestStreak = 31;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Skill Tracker
          </Link>

          {isPending || !session?.user ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600">
                Hi, {session.user.name}
              </span>
              <button
                onClick={() => authClient.signOut()}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/log"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Log practice
          </Link>
          <Link
            href="/dashboard/calendar"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
          >
            View calendar
          </Link>
          <Link
            href="/dashboard/skills/new"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
          >
            Add skill
          </Link>
        </div>

        {/* Streak strip */}
        <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Current streak</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-zinc-900">
              {currentStreak}
              <span className="ml-2 text-lg font-medium text-zinc-400">days</span>
            </p>
          </div>

          <div className="flex gap-6 sm:gap-10">
            <div>
              <p className="text-sm font-medium text-zinc-500">This week</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {formatHours(weekMinutes)}h
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Best streak</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {bestStreak} days
              </p>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Your skills</h2>
          <Link href="/dashboard/skills" className="text-sm font-medium text-zinc-500">
            Manage all →
          </Link>
        </div>

        {skillsLoading ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
              />
            ))}
          </div>
        ) : skillsError ? (
          <p className="mt-4 text-sm text-red-600">{skillsError}</p>
        ) : skills.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="text-sm text-zinc-500">
              You haven&apos;t added any skills yet.
            </p>
            <Link
              href="/dashboard/skills/new"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
            >
              Add your first skill
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: skill.color }}
                  />
                  <p className="font-medium text-zinc-900">{skill.name}</p>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {skill.sessionCount} sessions · {formatHours(skill.totalMinutes)}h total
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Sessions + calendar */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Recent sessions</h2>
              <Link href="/dashboard/sessions" className="text-sm font-medium text-zinc-500">
                View all →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-sm">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-12 shrink-0 text-xs text-zinc-400">{s.date}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.skillColor}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {s.skillName}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{s.title}</p>
                  </div>
                  <span className="shrink-0 text-sm text-zinc-600">
                    {s.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-zinc-900">Last 30 days</h2>
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-10 gap-1.5">
                {last30Days.map((intensity, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${
                      intensity === 0
                        ? "bg-zinc-100"
                        : intensity === 1
                        ? "bg-emerald-200"
                        : intensity === 2
                        ? "bg-emerald-400"
                        : "bg-emerald-600"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Less</span>
                <div className="h-2.5 w-2.5 rounded-sm bg-zinc-100" />
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-200" />
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                <div className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}