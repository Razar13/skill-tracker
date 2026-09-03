"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            ⚡ Skill Tracker
          </h1>
          <nav className="hidden gap-8 text-sm lg:flex">
            <a href="#features">Features</a>
            <a href="#process">Process</a>
            <a href="#pricing">Pricing</a>
          </nav>
          {isPending ? (
            // Avoid a flash of "Sign in" before we know the session state
            <div className="h-9 w-24 animate-pulse rounded-lg bg-[var(--surface)]" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-muted)]">
                Hi, {session.user.name}
              </span>
              <button
                onClick={() => authClient.signOut()}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)]"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[var(--background)] px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          )}
        </header>

        

        <section className="grid flex-1 items-center gap-16 py-20 lg:grid-cols-2">
          <div>
            <span className="rounded-full border border-[var(--primary)] px-3 py-1 text-xs font-semibold tracking-widest text-[var(--primary)]">
              TRACK YOUR PROGRESS
            </span>

            <h2 className="mt-6 text-6xl leading-none">
              Track Your Progress.
              <br />
              Master Any Skill.
            </h2>

            <p className="mt-6 max-w-xl text-lg text-[var(--text-muted)]">
              Log practice sessions, track your growth, and build expertise
              through consistent effort.
            </p>

            <div className="mt-8 flex gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-black"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-black"
                >
                  Get Started Free
                </Link>
              )}

              <button className="rounded-lg border border-white/20 px-6 py-3">
                Watch Demo
              </button>
            </div>
          </div>

          <Image
            src="/music-room.jpg"
            alt="Skill Tracker"
            width={700}
            height={500}
            className="rounded-3xl border border-white/10"
          />
        </section>
      </div>
    </main>
  );
}