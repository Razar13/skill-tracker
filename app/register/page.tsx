"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    setLoading(false);

    if (error) {
      setError(error.message || "Sign up failed.");
      return;
    }

    router.push("/");
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(240,177,62,0.05), transparent 55%), var(--bg)",
        color: "var(--ink)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded flex items-center justify-center display text-base"
            style={{ background: "var(--amber)", color: "#1a1207", boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
          >
            S
          </div>
          <span className="label-head text-lg">Skill Tracker</span>
        </div>

        <div className="card">
          <div className="mb-8">
            <h1 className="display text-2xl mb-1.5">Create your account</h1>
            <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
              Start tracking the skills you practice.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                NAME
              </label>
              <input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3 outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="email" className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                EMAIL
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3 outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="password" className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3 outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
                CONFIRM PASSWORD
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-3 outline-none transition-colors"
                style={inputStyle}
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#e08d8d" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-center">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--ink-faint)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--amber-dim)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}