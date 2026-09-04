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
  });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: { skillId: id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sessions: true } } },
  });

  return NextResponse.json(projects);
}

export async function POST(
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
  });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json(
      { error: "Name must be 80 characters or fewer." },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: { name, description: description || null, skillId: id },
  });

  return NextResponse.json(project, { status: 201 });
}