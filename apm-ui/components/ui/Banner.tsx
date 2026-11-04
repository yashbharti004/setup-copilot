import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertOctagon, CheckCircle2 } from "lucide-react";

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "warning" | "error" | "info" | "success";
  title?: string;
  icon?: React.ReactNode;
}

export function Banner({
  className,
  variant = "warning",
  title,
  icon,
  children,
  ...props
}: BannerProps) {
  const configs = {
    warning: {
      border: "border-amber-500/40",
      bg: "bg-amber-950/20 text-amber-200",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
      titleColor: "text-amber-400",
    },
    error: {
      border: "border-rose-500/40",
      bg: "bg-rose-950/20 text-rose-200",
      icon: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
      titleColor: "text-rose-400",
    },
    info: {
      border: "border-sky-500/40",
      bg: "bg-sky-950/20 text-sky-200",
      icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
      titleColor: "text-sky-400",
    },
    success: {
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/20 text-emerald-200",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      titleColor: "text-emerald-400",
    },
  };

  const c = configs[variant];

  return (
    <div
      role="alert"
      className={cn(
        "p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed font-sans",
        c.border,
        c.bg,
        className
      )}
      {...props}
    >
      <div className="mt-0.5">{icon || c.icon}</div>
      <div className="space-y-1 flex-1">
        {title && <div className={cn("font-bold text-xs uppercase font-mono", c.titleColor)}>{title}</div>}
        <div className="text-slate-300">{children}</div>
      </div>
    </div>
  );
}

