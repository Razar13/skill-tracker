import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULTS = { dailyReminder: true, weeklySummary: true, streakAlerts: false };
const KEYS = ["dailyReminder", "weeklySummary", "streakAlerts"] as const;

function pick(prefs: { dailyReminder: boolean; weeklySummary: boolean; streakAlerts: boolean }) {
  return {
    dailyReminder: prefs.dailyReminder,
    weeklySummary: prefs.weeklySummary,
    streakAlerts: prefs.streakAlerts,
  };
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(pick(prefs ?? DEFAULTS));
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const data: Partial<Record<(typeof KEYS)[number], boolean>> = {};
  for (const key of KEYS) {
    if (typeof body?.[key] === "boolean") data[key] = body[key];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const userId = session.user.id;
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...DEFAULTS, ...data },
    update: data,
  });

  return NextResponse.json(pick(prefs));
}