"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const COLOR_OPTIONS = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Orange", hex: "#f97316" },
  { name: "Slate", hex: "#64748b" },
];

export default function NewSkillPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].hex);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isPending && !session) {
    router.push("/login");
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give your skill a name.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, color }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Couldn't create the skill.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-500">
          ← Back to dashboard
        </Link>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Add a skill</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Create something new to track practice for.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Skill name
              </label>
              <input
                id="name"
                type="text"
                placeholder="English"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
              />
            </div>

            <div>
              <p className="mb-2 block text-sm font-medium text-zinc-700">
                Color
              </p>
              <div className="flex flex-wrap gap-3">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.hex}
                    type="button"
                    onClick={() => setColor(option.hex)}
                    aria-label={option.name}
                    aria-pressed={color === option.hex}
                    className={`h-9 w-9 rounded-full transition ${
                      color === option.hex
                        ? "ring-2 ring-zinc-900 ring-offset-2"
                        : ""
                    }`}
                    style={{ backgroundColor: option.hex }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save skill"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}