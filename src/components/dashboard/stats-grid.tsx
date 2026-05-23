"use client";

import { motion } from "framer-motion";
import { statCardVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardDef {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

interface StatsGridProps {
  stats: StatCardDef[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, isLoading, columns = 4 }: StatsGridProps) {
  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-3", {
        "grid-cols-2 sm:grid-cols-4": columns === 4,
        "grid-cols-2 sm:grid-cols-3": columns === 3,
        "grid-cols-2": columns === 2,
      })}
    >
      {stats.map((card, i) => (
        <motion.div
          key={card.label}
          custom={i}
          variants={statCardVariants}
          className="card-hover rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className={cn("rounded-lg p-2", card.bg)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold">{isLoading ? "—" : card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
