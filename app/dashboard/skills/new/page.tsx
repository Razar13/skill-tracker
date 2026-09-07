"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { SKILL_CATALOG, POPULAR_SKILL_NAMES, type CatalogSkill } from "@/lib/skill-catalog";

// Deterministic color per skill name so re-renders / re-visits stay consistent,
// since the catalog itself has no color field.
const COLOR_PALETTE = [
  "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981",
  "#f43f5e", "#06b6d4", "#f97316", "#64748b",
  "#ec4899", "#22c55e",
];

function colorForSkill(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

const CATEGORY_NAMES = SKILL_CATALOG.map((c) => c.category);

export default function NewSkillPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addingName, setAddingName] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState("");

  const allSkills: CatalogSkill[] = useMemo(
    () => SKILL_CATALOG.flatMap((c) => c.skills.map((s) => ({ ...s, category: c.category }))),
    []
  );

  const popularSkills = useMemo(
    () => allSkills.filter((s) => POPULAR_SKILL_NAMES.includes(s.name)),
    [allSkills]
  );

  const trimmedQuery = query.trim().toLowerCase();

  const filteredSkills = useMemo(() => {
    let pool = allSkills;
    if (activeCategory) pool = pool.filter((s) => s.category === activeCategory);
    if (trimmedQuery) pool = pool.filter((s) => s.name.toLowerCase().includes(trimmedQuery));
    return pool;
  }, [allSkills, activeCategory, trimmedQuery]);

  const browsing = Boolean(trimmedQuery) || Boolean(activeCategory);
  const visibleSkills = browsing ? filteredSkills : popularSkills;

  if (!isPending && !session) {
    router.push("/login");
    return null;
  }

  async function addSkill(name: string) {
    setError("");
    setAddingName(name);
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: colorForSkill(name) }),
    });
    setAddingName(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Couldn't add that skill.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCustomError("");

    const trimmedName = customName.trim();
    if (!trimmedName) {
      setCustomError("Give your skill a name.");
      return;
    }

    setCustomLoading(true);
    // NOTE: customDescription is not sent — the Skill model has no
    // description column yet. Add one via migration if you want it saved.
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, color: colorForSkill(trimmedName) }),
    });
    setCustomLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCustomError(data?.error || "Couldn't create the skill.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#121212] text-zinc-100 px-8 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="text-sm text-zinc-500 mb-2">
            <Link href="/dashboard/skills" className="hover:text-zinc-300">My Skills</Link>
            <span className="mx-2">&gt;</span>
            <span className="text-amber-500 font-medium">Add Skill</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Add New Skill</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Start tracking another milestone on your journey.
          </p>
        </div>

        <div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-amber-500">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveCategory(null);
              }}
              placeholder="Search for a skill (e.g. Saxophone, Music Production...)"
              className="w-full bg-[#18181A] border border-zinc-800 rounded-lg pl-12 pr-4 py-3.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => {
                setActiveCategory(null);
                setQuery("");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !activeCategory && !trimmedQuery
                  ? "bg-amber-500 text-black border-amber-500"
                  : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Popular
            </button>
            {CATEGORY_NAMES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setQuery("");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? "bg-amber-500 text-black border-amber-500"
                    : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {trimmedQuery ? `Results for "${query}"` : activeCategory ? activeCategory : "Popular Skills"}
          </h2>

          {visibleSkills.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No skills found. Try another search, or create your own below.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {visibleSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="bg-[#18181A] border border-zinc-800/50 rounded-xl overflow-hidden flex flex-col"
                >
                  <div
                    className="h-24 w-full"
                    style={{
                      background: `linear-gradient(135deg, ${colorForSkill(skill.name)}55 0%, #121212 100%)`,
                    }}
                  />
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-white mb-1">{skill.name}</h3>
                    <p className="text-xs text-zinc-500 mb-4 flex-1">{skill.description}</p>
                    <button
                      onClick={() => addSkill(skill.name)}
                      disabled={addingName === skill.name}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {addingName === skill.name ? "Adding..." : "+ Add"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Can&apos;t find your skill?</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Create a completely custom study tracking goal — it stays private to your account only.
          </p>

          <form onSubmit={handleCustomSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">Skill Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Recorder, Synthesizers, Ear Training"
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">Short Description</label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Briefly outline your core goals for this skill"
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {customError && <p className="text-sm text-red-400 md:col-span-2">{customError}</p>}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={customLoading}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-lg disabled:opacity-50"
              >
                {customLoading ? "Creating..." : "Create Custom Skill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}