import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const skill = await prisma.skill.findFirst({
    where: { id, userId: session.user.id },
    include: {
      sessions: {
        orderBy: { date: "desc" },
        include: { project: { select: { id: true, name: true } } },
      },
      projects: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { sessions: true } } },
      },
    },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  return NextResponse.json(skill);
}

const ALLOWED_LEVELS = ["Beginner", "Intermediate", "Expert"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingSkill = await prisma.skill.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existingSkill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const data: { name?: string; color?: string; level?: string } = {};

  if (body?.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or fewer." },
        { status: 400 }
      );
    }
    data.name = name;
  }

  if (body?.color !== undefined) {
    const color = typeof body.color === "string" ? body.color.trim() : "";
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: "Invalid color." }, { status: 400 });
    }
    data.color = color;
  }

  if (body?.level !== undefined) {
    if (!ALLOWED_LEVELS.includes(body.level)) {
      return NextResponse.json({ error: "Invalid level." }, { status: 400 });
    }
    data.level = body.level;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updatedSkill = await prisma.skill.update({ where: { id }, data });
  return NextResponse.json(updatedSkill);
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

  const existingSkill = await prisma.skill.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existingSkill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  // Deleting skill automatically deletes associated sessions due to Prisma onDelete: Cascade
  await prisma.skill.delete({ where: { id } });

  return NextResponse.json({ success: true });
}