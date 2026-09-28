export interface ExportedAttachment {
  fileUrl: string;
  fileType: string;
}

export interface ExportedSession {
  title: string;
  description: string | null;
  durationMinutes: number;
  date: string; // ISO date
  projectName: string | null; // resolved by name on import
  attachments: ExportedAttachment[];
}

export interface ExportedProject {
  name: string;
  description: string | null;
  createdAt: string;
}

export interface ExportedSkill {
  exportVersion: 1;
  type: "skill-tracker-export";
  skill: {
    name: string;
    color: string;
    level: string;
    imageUrl: string | null;
  };
  projects: ExportedProject[];
  sessions: ExportedSession[];
}

export interface ExportedSkillsBundle {
  exportVersion: 1;
  type: "skill-tracker-export-bundle";
  skills: ExportedSkill[];
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}