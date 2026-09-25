"use client";

import { useEffect, useRef, useState } from "react";
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
  const { data: session, isPending, refetch } = authClient.useSession();

  const [name, setName] = useState("");
  const nameTouched = useRef(false);
  const [email, setEmail] = useState("");

  // Locally-picked file, pending save. Once saved it becomes session.user.image
  // and this resets to null so the DB value takes over as the source of truth.
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyEmail, setWeeklyEmail] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(false);

  const [publicProfile, setPublicProfile] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync name from the session once it loads, but never overwrite something
  // the user is actively editing.
  useEffect(() => {
    if (session?.user?.name && !nameTouched.current) {
      setName(session.user.name);
    }
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

  const avatarSeed = email || name || "guest";
  const savedImage = session?.user?.image || null;
  const avatarSrc =
    avatarDraft ||
    savedImage ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;

  function handleChangeAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAvatarError("");
    setSaveSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarDraft(reader.result as string);
    reader.readAsDataURL(file);

    e.target.value = "";
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const { error } = await authClient.updateUser({
        name,
        ...(avatarDraft ? { image: avatarDraft } : {}),
      });

      if (error) {
        setSaveError(error.message || "Couldn't save your profile.");
        return;
      }

      await refetch();
      setAvatarDraft(null); // session.user.image now has the saved value
      setSaveSuccess(true);
    } catch {
      setSaveError("Couldn't save your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleExportData() {
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
              <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <button type="button" onClick={handleChangeAvatarClick} className="btn-stamp">
                CHANGE AVATAR
              </button>
              {avatarDraft && (
                <button type="button" onClick={() => setAvatarDraft(null)} className="btn-ghost ml-3">
                  UNDO
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              {avatarError && (
                <p className="text-xs mt-1.5" style={{ color: "#e08d8d" }}>
                  {avatarError}
                </p>
              )}
              {avatarDraft && !avatarError && (
                <p className="text-xs mt-1.5" style={{ color: "var(--ink-faint)" }}>
                  Not saved yet — click "Save changes" below.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mono text-[11px] tracking-wide block mb-1.5" style={{ color: "var(--ink-dim)" }}>
              NAME
            </label>
            <input
              value={name}
              onChange={(e) => {
                nameTouched.current = true;
                setName(e.target.value);
                setSaveSuccess(false);
              }}
              disabled={isPending}
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

          {saveError && (
            <p className="text-sm" style={{ color: "#e08d8d" }}>
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className="text-sm" style={{ color: "#7bc496" }}>
              Saved.
            </p>
          )}

          <div className="flex justify-end">
            <button onClick={handleSaveProfile} disabled={savingProfile || isPending} className="btn-primary">
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