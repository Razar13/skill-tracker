import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sessions: true } },
      sessions: { select: { durationMinutes: true } },
    },
  });

  const withTotals = skills.map(({ sessions, _count, ...skill }) => ({
    ...skill,
    sessionCount: _count.sessions,
    totalMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
  }));

  return NextResponse.json(withTotals);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > 50) {
    return NextResponse.json(
      { error: "Name must be 50 characters or fewer." },
      { status: 400 }
    );
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: "Invalid color." }, { status: 400 });
  }

  const skill = await prisma.skill.create({
    data: { name, color, userId: session.user.id },
  });

  return NextResponse.json(skill, { status: 201 });
}