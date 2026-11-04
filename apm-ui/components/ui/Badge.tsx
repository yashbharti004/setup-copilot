import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "neutral" | "info" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-sky-950/40 text-sky-300 border-sky-500/40",
    success: "bg-emerald-950/40 text-emerald-300 border-emerald-500/40",
    warning: "bg-amber-950/40 text-amber-300 border-amber-500/40",
    danger: "bg-rose-950/40 text-rose-300 border-rose-500/40",
    neutral: "bg-slate-800/60 text-slate-300 border-slate-600/50",
    info: "bg-indigo-950/40 text-indigo-300 border-indigo-500/40",
    outline: "bg-transparent text-slate-300 border-white/[0.15]",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono uppercase border rounded select-none font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
