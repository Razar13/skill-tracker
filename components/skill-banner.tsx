// components/skill-banner.tsx — new file
"use client";

interface SkillBannerProps {
  name: string;
  color: string;
  imageUrl?: string | null; // resolved: custom upload OR catalog photo OR null
  size?: "small" | "card" | "full";
  showLabel?: boolean;
}

const HEIGHT = { small: "h-[90px]", card: "h-[110px]", full: "h-[170px]" };
const LETTER = { small: "text-[70px]", card: "text-[88px]", full: "text-[150px]" };
const TITLE = { small: "text-[15px]", card: "text-base", full: "text-2xl" };

function darken(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.floor(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.floor(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.floor((n & 255) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function SkillBanner({ name, color, imageUrl, size = "card", showLabel = true }: SkillBannerProps) {
  return (
    <div className={`relative w-full ${HEIGHT[size]} rounded-md overflow-hidden flex items-end`}>
      {imageUrl ? (
        <>
          <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}, ${darken(color, 0.55)})` }} />
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px)" }}
          />
          <span
            className={`absolute ${LETTER[size]} font-bold leading-none select-none`}
            style={{ color: "rgba(255,255,255,0.16)", right: "6%", top: "50%", transform: "translateY(-50%)", fontFamily: "'Zilla Slab', serif" }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        </>
      )}
      {showLabel && (
        <span
          className={`relative z-10 px-4 pb-3 font-bold text-white ${TITLE[size]}`}
          style={{ fontFamily: "'Zilla Slab', serif", textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
        >
          {name}
        </span>
      )}
    </div>
  );
}