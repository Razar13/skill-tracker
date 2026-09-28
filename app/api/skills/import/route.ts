import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ExportedSkill, ExportedSkillsBundle } from "@/lib/export-import";

function isBundle(data: any): data is ExportedSkillsBundle {
  return data?.type === "skill-tracker-export-bundle" && Array.isArray(data.skills);
}

function isSingle(data: any): data is ExportedSkill {
  return data?.type === "skill-tracker-export" && data.skill;
}

const ALLOWED_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  if (!body || !body.target) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // --- Resolve what to import ---
  let toImport: ExportedSkill[] = [];

  if (body.source === "file") {
    const data = body.data;
    if (isBundle(data)) {
      toImport = data.skills;
    } else if (isSingle(data)) {
      toImport = [data];
    } else {
      return NextResponse.json(
        { error: "That file doesn't look like a Skill Tracker export." },
        { status: 400 }
      );
    }
  } else if (body.source === "skill") {
    const sourceSkillId = typeof body.sourceSkillId === "string" ? body.sourceSkillId : "";
    const sourceSkill = await prisma.skill.findFirst({
      where: { id: sourceSkillId, userId },
      include: {
        projects: true,
        sessions: { include: { project: true, attachments: true } },
      },
    });
    if (!sourceSkill) {
      return NextResponse.json({ error: "Skill to copy from was not found." }, { status: 404 });
    }
    toImport = [
      {
        exportVersion: 1,
        type: "skill-tracker-export",
        skill: {
          name: sourceSkill.name,
          color: sourceSkill.color,
          level: sourceSkill.level,
          imageUrl: sourceSkill.imageUrl,
        },
        projects: sourceSkill.projects.map((p) => ({
          name: p.name,
          description: p.description,
          createdAt: p.createdAt.toISOString(),
        })),
        sessions: sourceSkill.sessions.map((s) => ({
          title: s.title,
          description: s.description,
          durationMinutes: s.durationMinutes,
          date: s.date.toISOString(),
          projectName: s.project?.name ?? null,
          attachments: s.attachments.map((a) => ({ fileUrl: a.fileUrl, fileType: a.fileType })),
        })),
      },
    ];
  } else {
    return NextResponse.json({ error: "Invalid import source." }, { status: 400 });
  }

  if (toImport.length === 0) {
    return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
  }

  // --- Resolve the explicit target skill (never guessed from a name) ---
  const target = body.target;
  let targetSkill: { id: string; name: string } | null = null;

  if (target.mode === "existing") {
    const skillId = typeof target.skillId === "string" ? target.skillId : "";
    targetSkill = await prisma.skill.findFirst({ where: { id: skillId, userId } });
    if (!targetSkill) {
      return NextResponse.json({ error: "Target skill not found." }, { status: 404 });
    }
  } else if (target.mode === "new") {
    const name = typeof target.name === "string" ? target.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Give the new skill a name." }, { status: 400 });
    }
    if (name.length > 50) {
      return NextResponse.json({ error: "Name must be 50 characters or fewer." }, { status: 400 });
    }
    const color = /^#[0-9a-fA-F]{6}$/.test(target.color) ? target.color : "#3b82f6";
    const level = ALLOWED_LEVELS.includes(target.level) ? target.level : "Beginner";

    targetSkill = await prisma.skill.create({
      data: { userId, name, color, level, imageUrl: null },
    });
  } else {
    return NextResponse.json({ error: "Invalid import target." }, { status: 400 });
  }

  // --- Merge every imported skill's projects & sessions into the one target ---
  const existingProjects = await prisma.project.findMany({ where: { skillId: targetSkill.id } });
  const projectMap = new Map<string, string>();
  existingProjects.forEach((p) => projectMap.set(p.name.toLowerCase(), p.id));

  let sessionsImported = 0;

  for (const item of toImport) {
    for (const proj of item.projects) {
      const key = proj.name.toLowerCase();
      if (!projectMap.has(key)) {
        const newProject = await prisma.project.create({
          data: {
            skillId: targetSkill.id,
            name: proj.name,
            description: proj.description || null,
          },
        });
        projectMap.set(key, newProject.id);
      }
    }

    for (const sess of item.sessions) {
      const projectId = sess.projectName ? projectMap.get(sess.projectName.toLowerCase()) ?? null : null;
      const newSession = await prisma.practiceSession.create({
        data: {
          skillId: targetSkill.id,
          projectId,
          title: sess.title,
          description: sess.description || null,
          durationMinutes: sess.durationMinutes,
          date: new Date(sess.date),
        },
      });
      if (sess.attachments.length > 0) {
        await prisma.attachment.createMany({
          data: sess.attachments.map((a) => ({
            practiceSessionId: newSession.id,
            fileUrl: a.fileUrl,
            fileType: a.fileType,
          })),
        });
      }
      sessionsImported++;
    }
  }

  return NextResponse.json({
    skillId: targetSkill.id,
    skillName: targetSkill.name,
    sessionsImported,
  });
}