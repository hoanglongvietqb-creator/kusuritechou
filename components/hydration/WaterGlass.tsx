"use client";

import { cn } from "@/lib/utils";

type WaterGlassProps = {
  currentMl: number;
  goalMl: number;
  className?: string;
};

export function WaterGlass({ currentMl, goalMl, className }: WaterGlassProps) {
  const pct = Math.min(100, goalMl > 0 ? (currentMl / goalMl) * 100 : 0);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg
        viewBox="0 0 120 160"
        className="h-44 w-32 drop-shadow-sm"
        aria-label={`水分 ${Math.round(pct)}%`}
      >
        <defs>
          <clipPath id="glass-clip">
            <path d="M30 20 L90 20 L85 140 Q60 150 35 140 Z" />
          </clipPath>
          <linearGradient id="water-gradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <path
          d="M30 20 L90 20 L85 140 Q60 150 35 140 Z"
          fill="none"
          stroke="#bae6fd"
          strokeWidth="3"
        />
        <g clipPath="url(#glass-clip)">
          <rect
            x="25"
            y={140 - (120 * pct) / 100}
            width="70"
            height={(120 * pct) / 100 + 10}
            fill="url(#water-gradient)"
            className="transition-all duration-700 ease-out"
          />
          {pct > 10 && (
            <ellipse
              cx="60"
              cy={140 - (120 * pct) / 100}
              rx="32"
              ry="4"
              fill="#7dd3fc"
              opacity="0.6"
              className="transition-all duration-700 ease-out"
            />
          )}
        </g>
      </svg>
      <p className="text-2xl font-bold text-water-dark">
        {currentMl}
        <span className="text-sm font-normal text-muted"> / {goalMl} ml</span>
      </p>
      <p className="text-sm text-muted">{Math.round(pct)}% 達成</p>
    </div>
  );
}
