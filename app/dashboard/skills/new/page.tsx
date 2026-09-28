"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import SkillBanner from "@/components/skill-banner";
import { getCatalogImage } from "@/lib/skill-catalog";
import { SKILL_CATALOG, POPULAR_SKILL_NAMES, getSkillColor as colorForSkill, type CatalogSkill } from "@/lib/skill-catalog";

// Deterministic color per skill name so re-renders / re-visits stay consistent,
// since the catalog itself has no color field.


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

  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<"file" | "skill">("file");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSourceSkillId, setImportSourceSkillId] = useState("");
  const [existingSkills, setExistingSkills] = useState<{ id: string; name: string }[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importName, setImportName] = useState("");

  useEffect(() => {
    if (showImport && importMode === "skill" && existingSkills.length === 0) {
      fetch("/api/skills")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setExistingSkills(data));
    }
  }, [showImport, importMode, existingSkills.length]);

  
  async function handleImportSubmit() {
    setImportError("");

    if (!importName.trim()) {
      setImportError("Give the new skill a name.");
      return;
    }

    let payload: any;
    if (importMode === "file") {
      if (!importFile) {
        setImportError("Choose a file to import.");
        return;
      }
      try {
        const text = await importFile.text();
        payload = { source: "file", data: JSON.parse(text) };
      } catch {
        setImportError("That file isn't valid JSON.");
        return;
      }
    } else {
      if (!importSourceSkillId) {
        setImportError("Choose a skill to copy from.");
        return;
      }
      payload = { source: "skill", sourceSkillId: importSourceSkillId };
    }

    const trimmedName = importName.trim();
    payload.target = { mode: "new", name: trimmedName, color: colorForSkill(trimmedName) };

    setImportLoading(true);
    const res = await fetch("/api/skills/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setImportLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setImportError(data?.error || "Import failed.");
      return;
    }

    router.push("/dashboard/skills");
    router.refresh();
  }

  async function addSkill(name: string) {
    setError("");
    setAddingName(name);
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color: colorForSkill(name), imageUrl: customImagePreview || null }),
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

  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setCustomImagePreview(reader.result as string);
    reader.readAsDataURL(file);
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
      body: JSON.stringify({ name: trimmedName, color: colorForSkill(trimmedName), imageUrl: customImagePreview || null }),
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

        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="text-xs underline text-zinc-500 hover:text-zinc-300"
          >
            {showImport ? "Hide import" : "Or import existing data"}
          </button>
        </div>

        {showImport && (
          <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Import data</h2>
            <p className="text-sm text-zinc-500">
              Bring in a previously exported JSON file, or copy sessions and projects from another
              skill in your account. If a skill with the same name already exists, the imported
              data is added to it rather than replacing it.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">New skill name</label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                maxLength={50}
                placeholder="e.g. Language, Game Development"
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 text-zinc-300">
                <input type="radio" checked={importMode === "file"} onChange={() => setImportMode("file")} />
                JSON file
              </label>
              <label className="flex items-center gap-2 text-zinc-300">
                <input type="radio" checked={importMode === "skill"} onChange={() => setImportMode("skill")} />
                Copy from a skill I have
              </label>
            </div>

            {importMode === "file" ? (
              <input
                type="file"
                accept="application/json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-sm text-zinc-400"
              />
            ) : (
              <select
                value={importSourceSkillId}
                onChange={(e) => setImportSourceSkillId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none"
              >
                <option value="">Select a skill…</option>
                {existingSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {importError && <p className="text-sm text-red-400">{importError}</p>}

            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={importLoading}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm rounded-lg disabled:opacity-50"
            >
              {importLoading ? "Importing..." : "Import"}
            </button>
          </div>
        )}

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
                  <SkillBanner
                    name={skill.name}
                    color={colorForSkill(skill.name)}
                    imageUrl={getCatalogImage(skill.name)}
                    size="small"
                    showLabel={false}
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
              <label className="block text-sm font-medium mb-1.5 text-zinc-300">Photo (optional)</label>
              <input type="file" accept="image/*" onChange={handleImagePick} className="text-sm text-zinc-400" />
              {customImagePreview && (
                <img src={customImagePreview} alt="Preview" className="mt-3 h-24 w-40 object-cover rounded-lg" />
              )}
            </div>

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