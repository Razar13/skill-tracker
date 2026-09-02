import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.practiceSession.findMany({
    where: {
      skill: {
        userId: session.user.id,
      },
    },
    include: {
      skill: {
        select: { name: true, color: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { skillId, title, description, durationMinutes, date } = body || {};

  if (!skillId || !title || !durationMinutes) {
    return NextResponse.json(
      { error: "Skill, title, and duration are required." },
      { status: 400 }
    );
  }

  // Ensure user owns this skill
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId: session.user.id },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const practiceSession = await prisma.practiceSession.create({
    data: {
      skillId,
      title: title.trim(),
      description: description?.trim() || null,
      durationMinutes: Number(durationMinutes),
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(practiceSession, { status: 201 });
}