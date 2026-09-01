export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Sign in to continue tracking your skills.
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <a href="/register" className="font-medium text-zinc-900">
              Create one
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}