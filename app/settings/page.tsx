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
      className="w-10 h-6 rounded-full transition-colors relative shrink-0"
      style={{ background: checked ? "var(--amber)" : "var(--card-raised)", border: "1px solid var(--rule)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
        style={{
          background: checked ? "#1a1207" : "var(--ink-faint)",
          transform: checked ? "translateX(16px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

function Section({ title, description, tabColor, children }: { title: string; description?: string; tabColor?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={tabColor ? ({ "--tab-color": tabColor } as React.CSSProperties) : undefined}>
      <h2 className="label-head text-[16px] tracking-wide">{title}</h2>
      {description && (
        <p className="text-sm mt-1 mb-5" style={{ color: "var(--ink-faint)" }}>
          {description}
        </p>
      )}
      <div className={description ? "space-y-4" : "space-y-4 mt-5"}>{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm" style={{ color: "var(--ink)" }}>
          {label}
        </p>
        {hint && (
          <p className="mono text-[11px] mt-0.5" style={{ color: "var(--ink-faint)" }}>
            {hint}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--card-raised)",
  border: "1px solid var(--rule)",
  color: "var(--ink)",
};

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
      <div className="p-8 max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="display text-[28px] mb-1">Settings</h1>
          <p className="text-sm" style={{ color: "var(--ink-faint)" }}>
            Manage your account and preferences.
          </p>
        </div>

        <Section title="Profile">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden" style={{ background: "var(--card-raised)", border: "1px solid var(--rule)" }}>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email || name)}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="btn-stamp">CHANGE AVATAR</button>
          </div>

          <div>
            <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
              NAME
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
              EMAIL
            </label>
            <input
              value={email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg cursor-not-allowed"
              style={{ ...inputStyle, color: "var(--ink-faint)" }}
            />
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary">
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
            <button onClick={handleExportData} className="btn-stamp">
              EXPORT
            </button>
          </Row>
        </Section>

        <Section title="Appearance">
          <Row label="Theme" hint="More themes coming later — Card Catalog dark is the only one for now.">
            <span
              className="mono text-[10px] tracking-wide px-2.5 py-1 rounded-full"
              style={{ background: "rgba(240,177,62,0.1)", color: "var(--amber)", border: "1px solid var(--amber-dim)" }}
            >
              CARD CATALOG (DARK)
            </span>
          </Row>
        </Section>

        <Section title="Danger zone" tabColor="#c66">
          <Row label="Delete account" hint="Permanently deletes your account, skills, sessions, and attachments.">
            <button
              onClick={() => setDeleteOpen(true)}
              className="btn-stamp"
              style={{ color: "#c66", borderColor: "rgba(198,102,102,0.5)" }}
            >
              DELETE ACCOUNT
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