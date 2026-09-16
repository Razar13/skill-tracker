"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import ConfirmDialog from "@/components/confirm-dialog";
import { authClient } from "@/lib/auth-client";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
        checked ? "bg-amber-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#18181A] border border-zinc-800/50 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {description && <p className="text-sm text-zinc-500 mt-1 mb-5">{description}</p>}
      <div className={description ? "space-y-4" : "space-y-4 mt-5"}>{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {hint && <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = authClient.useSession();

  const [name, setName] = useState(session?.user?.name || "");
  const [email] = useState(session?.user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(false);

  const [publicProfile, setPublicProfile] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleSaveProfile() {
    setSavingProfile(true);
    // TODO: wire to a PATCH /api/user route once it exists.
    await new Promise((r) => setTimeout(r, 500));
    setSavingProfile(false);
  }

  function handleExportData() {
    // Mockup: real version would hit an API route that dumps the user's
    // skills/sessions/projects as JSON.
    const blob = new Blob(
      [JSON.stringify({ note: "export not wired up yet" }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skill-tracker-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your account and preferences.</p>
        </div>

        <Section title="Profile">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-zinc-700 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email || name)}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="px-3 py-1.5 text-xs border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg">
              Change avatar
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-zinc-300">Email</label>
            <input
              value={email}
              disabled
              className="w-full px-3 py-2.5 bg-[#0f0f10] border border-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </Section>

        <Section title="Notifications" description="Choose when Skill Tracker should nudge you.">
          <Row label="Daily practice reminder" hint="A push notification if you haven't logged today.">
            <Toggle checked={dailyReminder} onChange={setDailyReminder} />
          </Row>
          <Row label="Weekly summary email" hint="Recap of hours practiced and streaks.">
            <Toggle checked={weeklyEmail} onChange={setWeeklyEmail} />
          </Row>
          <Row label="Streak-at-risk alerts" hint="Warn me before a streak breaks.">
            <Toggle checked={streakAlerts} onChange={setStreakAlerts} />
          </Row>
        </Section>

        <Section title="Privacy" description="Control visibility and your data.">
          <Row label="Public profile" hint="Let others view your skills and stats via a shareable link.">
            <Toggle checked={publicProfile} onChange={setPublicProfile} />
          </Row>
          <Row label="Export my data" hint="Download all your skills, sessions, and projects as JSON.">
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 text-xs border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-lg"
            >
              Export
            </button>
          </Row>
        </Section>

        <Section title="Appearance">
          <Row label="Theme" hint="More themes coming later — Card Catalog dark is the only one for now.">
            <span className="text-xs px-2.5 py-1 bg-amber-900/20 text-amber-500 border border-amber-700/40 rounded-full">
              Card Catalog (Dark)
            </span>
          </Row>
        </Section>

        <Section title="Danger zone">
          <Row label="Delete account" hint="Permanently deletes your account, skills, sessions, and attachments.">
            <button
              onClick={() => setDeleteOpen(true)}
              className="px-3 py-1.5 text-xs border border-zinc-800 hover:border-red-800 hover:text-red-400 text-zinc-500 rounded-lg"
            >
              Delete account
            </button>
          </Row>
        </Section>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete your account?"
        message="This permanently deletes your account and everything in it. This can't be undone."
        isSubmitting={false}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          // TODO: wire to a real DELETE /api/user route.
          setDeleteOpen(false);
        }}
      />
    </DashboardLayout>
  );
}