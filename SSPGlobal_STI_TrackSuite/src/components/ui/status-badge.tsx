import { cn } from "@/lib/utils";

export type StatusConfig = Record<string, { bg: string; dot: string; label: string }>;

const DEFAULT_STATUSES: StatusConfig = {
  Active: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Active" },
  Inactive: { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", dot: "bg-gray-500", label: "Inactive" },
  Ongoing: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Ongoing" },
  Upcoming: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", label: "Upcoming" },
  Completed: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500", label: "Completed" },
  Scheduled: { bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", dot: "bg-indigo-500", label: "Scheduled" },
  Running: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Running" },
  Cancelled: { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", dot: "bg-rose-500", label: "Cancelled" },
  Holiday: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", label: "Holiday" },
  Postponed: { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", dot: "bg-orange-500", label: "Postponed" },
  PAP: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500", label: "PAP" },
  Enrolled: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Enrolled" },
  Dropped: { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", dot: "bg-rose-500", label: "Dropped" },
  Graduated: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500", label: "Graduated" },
  New: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", label: "New" },
  Contacted: { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", dot: "bg-purple-500", label: "Contacted" },
  Qualified: { bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20", dot: "bg-cyan-500", label: "Qualified" },
  Lost: { bg: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20", dot: "bg-gray-500", label: "Lost" },
};

interface StatusBadgeProps {
  status: string;
  customConfig?: StatusConfig;
  className?: string;
}

export function StatusBadge({ status, customConfig, className }: StatusBadgeProps) {
  const config = customConfig?.[status] || DEFAULT_STATUSES[status];
  if (!config) {
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground", className)}>
        {status}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", config.bg, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
