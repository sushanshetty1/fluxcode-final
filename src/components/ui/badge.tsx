"use client";

import { cn } from "~/lib/utils";
import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors uppercase tracking-wider",
        {
          "bg-white/10 border-white/20 text-white": variant === "default",
          "bg-primary/10 border-primary/20 text-primary": variant === "primary",
          "bg-white/5 border-white/10 text-white/60": variant === "secondary",
          "bg-green-500/10 border-green-500/20 text-green-400": variant === "success",
          "bg-yellow-500/10 border-yellow-500/20 text-yellow-400": variant === "warning",
          "bg-red-500/10 border-red-500/20 text-red-400": variant === "danger",
        },
        className
      )}
      {...props}
    />
  );
}
