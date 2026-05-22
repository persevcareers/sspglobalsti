import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateInput(date: string) {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function generateId(): string {
  return `ID-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    inactive: "bg-muted/50 text-muted-foreground border-border",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dropped: "bg-red-500/10 text-red-500 border-red-500/20",
    "in-progress": "bg-amber-500/10 text-amber-500 border-amber-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    new: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    contacted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    qualified: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    converted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    lost: "bg-red-500/10 text-red-500 border-red-500/20",
    upcoming: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  };
  return colors[status] || colors.inactive;
}

export function truncate(str: string, len: number = 50): string {
  if (!str) return "-";
  return str.length > len ? str.substring(0, len) + "..." : str;
}
