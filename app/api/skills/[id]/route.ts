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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "";

  if (!name || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  // Ensure user owns this skill
  const existingSkill = await prisma.skill.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existingSkill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const updatedSkill = await prisma.skill.update({
    where: { id },
    data: { name, color },
  });

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