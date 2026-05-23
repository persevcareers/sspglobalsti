import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getAvatarColor(name: string): string {
  const colors = [
    "from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400",
    "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
    "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
    "from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-400",
    "from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400",
    "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-400",
    "from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-400",
    "from-orange-500/20 to-rose-500/20 text-orange-600 dark:text-orange-400",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}
