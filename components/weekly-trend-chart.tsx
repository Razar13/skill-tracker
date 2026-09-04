"use client";

interface DayPoint {
  dateStr: string;
  label: string;
  minutes: number;
}

interface WeeklyTrendChartProps {
  data: DayPoint[];
}

export default function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const width = 700;
  const height = 160;
  const paddingX = 20;
  const paddingY = 20;
  const max = Math.max(...data.map((d) => d.minutes), 1);

  const points = data.map((d, i) => {
    const x = paddingX + (i * (width - paddingX * 2)) / (data.length - 1);
    const y = height - paddingY - (d.minutes / max) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A524" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F5A524" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trendFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#F5A524"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p) => (
          <circle key={p.dateStr} cx={p.x} cy={p.y} r="4" fill="#18181A" stroke="#F5A524" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-1">
        {data.map((d) => (
          <div
            key={d.dateStr}
            className="flex flex-col items-center text-center"
            style={{ width: `${100 / data.length}%` }}
          >
            <span className="text-[10px] text-zinc-500">{d.label}</span>
            <span className="text-[11px] font-semibold text-zinc-300">{d.minutes}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}