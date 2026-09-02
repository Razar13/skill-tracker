import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { title, description, durationMinutes, date } = body || {};

  const existingSession = await prisma.practiceSession.findFirst({
    where: { id, skill: { userId: session.user.id } },
  });

  if (!existingSession) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const updatedSession = await prisma.practiceSession.update({
    where: { id },
    data: {
      title: title?.trim() || existingSession.title,
      description: description !== undefined ? description?.trim() : existingSession.description,
      durationMinutes: durationMinutes ? Number(durationMinutes) : existingSession.durationMinutes,
      date: date ? new Date(date) : existingSession.date,
    },
  });

  return NextResponse.json(updatedSession);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingSession = await prisma.practiceSession.findFirst({
    where: { id, skill: { userId: session.user.id } },
  });

  if (!existingSession) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  await prisma.practiceSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}