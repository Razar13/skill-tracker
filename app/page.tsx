import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Skill Tracker</h1>

          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </Link>
        </header>

        <section className="flex flex-1 items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium text-zinc-500">
              Practice. Track. Improve.
            </p>

            <h2 className="text-5xl font-bold tracking-tight text-zinc-900">
              Build skills,
              <br />
              one day at a time.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
              Keep track of the skills you practice every day and see your
              progress over time.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-block rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white"
            >
              Get started
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}