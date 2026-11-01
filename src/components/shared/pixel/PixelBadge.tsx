import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PixelBadgeProps {
  children: ReactNode;
  variant?: "yellow" | "green" | "red" | "blue" | "dark" | "outline";
  className?: string;
}

export function PixelBadge({ children, variant = "yellow", className }: PixelBadgeProps) {
  const variantStyles = {
    yellow: "bg-taxi text-pixel-border border-pixel-border",
    green: "bg-emerald-400 text-pixel-border border-pixel-border",
    red: "bg-rose-400 text-white border-pixel-border",
    blue: "bg-blue-400 text-white border-pixel-border",
    dark: "bg-pixel-dark text-white border-pixel-border",
    outline: "bg-white text-pixel-border border-pixel-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold font-mono uppercase tracking-wider rounded border-2 shadow-pixel-sm",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
