import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507] disabled:opacity-50 disabled:pointer-events-none select-none active:translate-y-px rounded-lg";

    const variantStyles = {
      primary:
        "bg-white text-black hover:bg-slate-200 font-semibold shadow-sm",
      secondary:
        "bg-white/[0.06] hover:bg-white/[0.1] text-slate-100 border border-white/[0.1]",
      outline:
        "border border-white/[0.15] hover:border-white/[0.3] text-slate-200 hover:bg-white/[0.04]",
      ghost:
        "text-slate-300 hover:text-white hover:bg-white/[0.06]",
      danger:
        "bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/50",
    };

    const sizeStyles = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-xs sm:text-sm px-4 py-2 gap-2",
      lg: "text-sm sm:text-base px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent animate-spin rounded-full inline-block shrink-0" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
