"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ActivityLogEntry } from "@/types";
import { cn } from "@/lib/utils";
import {
  Clock, Plus, Pencil, Trash2, XCircle, Calendar,
  RefreshCw, UserPlus, Link, Bell, AlertTriangle,
} from "lucide-react";

const ACTION_ICONS: Record<string, typeof Clock> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  cancelled: XCircle,
  rescheduled: RefreshCw,
  completed: Calendar,
  reminder_triggered: Bell,
  attendee_added: UserPlus,
  meeting_link_updated: Link,
  status_changed: RefreshCw,
  overdue: AlertTriangle,
};

const ACTION_COLORS: Record<string, string> = {
  created: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  updated: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  deleted: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-500",
  rescheduled: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  reminder_triggered: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  attendee_added: "border-indigo-500/30 bg-indigo-500/10 text-indigo-500",
  meeting_link_updated: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500",
  status_changed: "border-purple-500/30 bg-purple-500/10 text-purple-500",
  overdue: "border-red-500/30 bg-red-500/10 text-red-500",
};

interface ActivityTimelineProps {
  logs: ActivityLogEntry[];
  isLoading?: boolean;
}

export function ActivityTimeline({ logs, isLoading }: ActivityTimelineProps) {
  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => {
      return b["Timestamp (IST)"].localeCompare(a["Timestamp (IST)"]);
    }).slice(0, 50);
  }, [logs]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 rounded bg-muted" />
              <div className="h-2 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-0">
        {sorted.map((log, idx) => {
          const action = log.Action.toLowerCase();
          const Icon = ACTION_ICONS[action] || Clock;
          const colorClass = ACTION_COLORS[action] || "border-gray-500/30 bg-gray-500/10 text-gray-500";
          return (
            <motion.div
              key={log["Log ID"] || idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="relative flex items-start gap-3 pb-3 pl-0"
            >
              <div className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", colorClass)}>
                <Icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs leading-snug">
                  <span className="font-medium">{log["Event Title"]}</span>
                  {log.Details && (
                    <span className="text-muted-foreground"> — {log.Details}</span>
                  )}
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">{log["Timestamp (IST)"]}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
