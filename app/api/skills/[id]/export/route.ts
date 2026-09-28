import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ExportedSkill } from "@/lib/export-import";

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
      projects: true,
      sessions: {
        include: { project: true, attachments: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const exported: ExportedSkill = {
    exportVersion: 1,
    type: "skill-tracker-export",
    skill: {
      name: skill.name,
      color: skill.color,
      level: skill.level,
      imageUrl: skill.imageUrl,
    },
    projects: skill.projects.map((p) => ({
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
    })),
    sessions: skill.sessions.map((s) => ({
      title: s.title,
      description: s.description,
      durationMinutes: s.durationMinutes,
      date: s.date.toISOString(),
      projectName: s.project?.name ?? null,
      attachments: s.attachments.map((a) => ({ fileUrl: a.fileUrl, fileType: a.fileType })),
    })),
  };

  return NextResponse.json(exported);
}