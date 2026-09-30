export interface NotificationPrefs {
  dailyReminder: boolean;
  weeklySummary: boolean;
  streakAlerts: boolean;
}

export interface AppNotification {
  id: string; // stable per day/week, used to remember dismissals
  kind: "daily" | "streak" | "weekly";
  title: string;
  body: string;
  href: string;
  color?: string;
}

interface SkillLite {
  id: string;
  name: string;
  color: string;
}

interface SessionLite {
  skillId: string;
  durationMinutes: number;
  date: string;
}

interface BuildInput {
  skills: SkillLite[];
  sessions: SessionLite[];
  prefs: NotificationPrefs;
  now?: Date;
}

// Same date convention as the rest of the app (UTC day string).
const toDateStr = (d: Date) => d.toISOString().split("T")[0];

function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
}

function streakEndingAt(dates: Set<string>, end: string) {
  let count = 0;
  let cursor = end;
  while (dates.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function buildNotifications({ skills, sessions, prefs, now = new Date() }: BuildInput): AppNotification[] {
  const today = toDateStr(now);
  const yesterday = addDays(today, -1);

  const datesBySkill = new Map<string, Set<string>>();
  let practicedToday = false;
  for (const s of sessions) {
    const dateStr = toDateStr(new Date(s.date));
    if (dateStr === today) practicedToday = true;
    let set = datesBySkill.get(s.skillId);
    if (!set) {
      set = new Set();
      datesBySkill.set(s.skillId, set);
    }
    set.add(dateStr);
  }

  const items: AppNotification[] = [];

  // 1) Streak at risk: practiced yesterday, not yet today, streak of 2+ days.
  if (prefs.streakAlerts) {
    for (const skill of skills) {
      const dates = datesBySkill.get(skill.id);
      if (!dates || dates.has(today) || !dates.has(yesterday)) continue;
      const streak = streakEndingAt(dates, yesterday);
      if (streak >= 2) {
        items.push({
          id: `streak:${skill.id}:${today}`,
          kind: "streak",
          title: `${skill.name} streak at risk`,
          body: `You're on a ${streak}-day streak. Log today to keep it alive.`,
          href: `/dashboard/log?skillId=${skill.id}`,
          color: skill.color,
        });
      }
    }
  }

  // 2) Daily reminder: nothing logged today.
  if (prefs.dailyReminder && skills.length > 0 && !practicedToday) {
    items.push({
      id: `daily:${today}`,
      kind: "daily",
      title: "No practice logged today",
      body:
        skills.length === 1
          ? `${skills[0].name} is waiting for you.`
          : `${skills.length} skills are waiting for you.`,
      href: "/dashboard/log",
    });
  }

  // 3) Weekly summary: last full Monday–Sunday.
  if (prefs.weeklySummary) {
    const dayOffset = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
    const thisMonday = addDays(today, -dayOffset);
    const lastMonday = addDays(thisMonday, -7);

    const minutesBySkill = new Map<string, number>();
    let total = 0;
    for (const s of sessions) {
      const dateStr = toDateStr(new Date(s.date));
      if (dateStr >= lastMonday && dateStr < thisMonday) {
        total += s.durationMinutes;
        minutesBySkill.set(s.skillId, (minutesBySkill.get(s.skillId) ?? 0) + s.durationMinutes);
      }
    }

    if (total > 0) {
      let topId = "";
      let topMins = 0;
      for (const [id, mins] of minutesBySkill) {
        if (mins > topMins) {
          topId = id;
          topMins = mins;
        }
      }
      const top = skills.find((s) => s.id === topId);
      const count = minutesBySkill.size;
      items.push({
        id: `weekly:${lastMonday}`,
        kind: "weekly",
        title: "Your week in review",
        body: `${formatDuration(total)} across ${count} skill${count === 1 ? "" : "s"}${
          top ? `, most time on ${top.name}.` : "."
        }`,
        href: "/stats",
      });
    }
  }

  return items;
}