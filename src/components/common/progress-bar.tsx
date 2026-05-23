"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ProgressBar({ value, max = 100, color, showLabel = true, size = "sm" }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || (pct === 100 ? "bg-blue-500" : pct >= 60 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-rose-500");
  const barHeight = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className="flex items-center gap-2">
      <div className={`${barHeight} w-16 overflow-hidden rounded-full bg-muted`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      {showLabel && <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>}
    </div>
  );
}
