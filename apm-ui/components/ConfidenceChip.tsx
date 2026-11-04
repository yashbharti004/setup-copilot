import React from "react";
import { ConfidenceLevel } from "@/lib/schema/guide";
import { cn } from "@/lib/utils";

interface ConfidenceChipProps {
  status: ConfidenceLevel;
  className?: string;
  onClick?: () => void;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export function ConfidenceChip({
  status,
  className,
  onClick,
  size = "md",
}: ConfidenceChipProps) {
  const configs: Record<
    ConfidenceLevel,
    { label: string; tag: string; text: string; border: string; bg: string }
  > = {
    verified: {
      label: "Verified by test",
      tag: "VERIFIED",
      text: "text-emerald-400",
      border: "border-emerald-500/40 hover:border-emerald-400",
      bg: "bg-emerald-950/20",
    },
    sourced: {
      label: "Official docs",
      tag: "DOCS",
      text: "text-sky-400",
      border: "border-sky-500/40 hover:border-sky-400",
      bg: "bg-sky-950/20",
    },
    community: {
      label: "Community-reported",
      tag: "COMMUNITY",
      text: "text-amber-400",
      border: "border-amber-500/40 hover:border-amber-400",
      bg: "bg-amber-950/20",
    },
    unknown: {
      label: "Unknown / Unverified",
      tag: "UNKNOWN",
      text: "text-slate-400",
      border: "border-slate-700 hover:border-slate-500",
      bg: "bg-slate-900/60",
    },
  };

  const c = configs[status] || configs.sourced;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-[11px] px-2 py-0.5",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Confidence grade: ${c.label}. Click to inspect audited citation.`}
      className={cn(
        "inline-flex items-center gap-1 font-mono uppercase border transition-all cursor-pointer text-left select-none active:translate-y-px",
        c.bg,
        c.text,
        c.border,
        sizeClasses[size],
        className
      )}
    >
      <span className="opacity-50">§</span>
      <span className="font-semibold tracking-wider">{c.tag}</span>
    </button>
  );
}
