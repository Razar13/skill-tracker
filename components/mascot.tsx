"use client";

const MOOD_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];
const MOOD_NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

function getMoodScore(streak: number, daysSinceLastPractice: number): number {
  if (daysSinceLastPractice >= 2) return 0;
  if (streak === 0) return 1;
  if (streak < 3) return 2;
  if (streak < 7) return 3;
  return 4;
}

interface MascotProps {
  streak: number;
  daysSinceLastPractice: number;
}

export default function Mascot({ streak, daysSinceLastPractice }: MascotProps) {
  const score = getMoodScore(streak, daysSinceLastPractice);

  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: "var(--card-raised)", border: "1px solid var(--tab-border)" }}
      title={`Mascot mood: ${MOOD_LABELS[score]} (placeholder — real art coming later)`}
    >
      <span aria-hidden="true">{MOOD_NUMBER_EMOJIS[score]}</span>
    </div>
  );
}