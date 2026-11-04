import React from "react";
import { DifficultyLevel } from "@/lib/schema/guide";
import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  score?: number;
  lowerBound?: boolean;
  className?: string;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DifficultyBadge({
  difficulty,
  score,
  lowerBound = false,
  className,
  showScore = true,
  size = "md",
}: DifficultyBadgeProps) {
  const configs: Record<
    DifficultyLevel,
    { text: string; border: string; bg: string; code: string }
  > = {
    Easy: {
      text: "text-emerald-400",
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/20",
      code: "00",
    },
    Moderate: {
      text: "text-amber-400",
      border: "border-amber-500/40",
      bg: "bg-amber-950/20",
      code: "25",
    },
    Hard: {
      text: "text-rose-400",
      border: "border-rose-500/40",
      bg: "bg-rose-950/20",
      code: "80",
    },
    Gated: {
      text: "text-purple-400",
      border: "border-purple-500/40",
      bg: "bg-purple-950/20",
      code: "85",
    },
    UNKNOWN: {
      text: "text-slate-300",
      border: "border-slate-600/60",
      bg: "bg-slate-800/50",
      code: "--",
    },
  };

  const normalizedDiff = (
    difficulty?.toLowerCase() === "unknown"
      ? "UNKNOWN"
      : difficulty
  ) as DifficultyLevel;

  const c = configs[normalizedDiff] || configs.UNKNOWN;

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 tracking-wider",
    md: "text-[11px] px-2.5 py-0.5 tracking-wider",
    lg: "text-xs px-3 py-1 tracking-widest font-semibold",
  };

  let scoreStr = typeof score === "number" ? String(score).padStart(2, "0") : c.code;
  if (lowerBound && typeof score === "number") {
    scoreStr = `≥${score}`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono uppercase border select-none transition-colors rounded",
        c.bg,
        c.text,
        c.border,
        sizeClasses[size],
        className
      )}
    >
      <span className="opacity-60">[</span>
      <span>{normalizedDiff}</span>
      {showScore && (
        <>
          <span className="opacity-40">//</span>
          <span className="tabular-nums font-bold">{scoreStr}</span>
        </>
      )}
      <span className="opacity-60">]</span>
    </span>
  );
}
