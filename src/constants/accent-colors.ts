export type AccentColorName = "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan"

export interface AccentPalette {
  base: string
  heavy: string
  soft: string
  fg: string
  ring: string
  glow: string
}

export const ACCENT_COLORS: Record<AccentColorName, AccentPalette> = {
  indigo: {
    base: "#6366f1",
    heavy: "#4f46e5",
    soft: "rgba(99, 102, 241, 0.1)",
    fg: "#ffffff",
    ring: "rgba(99, 102, 241, 0.25)",
    glow: "rgba(99, 102, 241, 0.6)",
  },
  emerald: {
    base: "#10b981",
    heavy: "#059669",
    soft: "rgba(16, 185, 129, 0.1)",
    fg: "#ffffff",
    ring: "rgba(16, 185, 129, 0.25)",
    glow: "rgba(16, 185, 129, 0.6)",
  },
  amber: {
    base: "#f59e0b",
    heavy: "#d97706",
    soft: "rgba(245, 158, 11, 0.1)",
    fg: "#000000",
    ring: "rgba(245, 158, 11, 0.25)",
    glow: "rgba(245, 158, 11, 0.6)",
  },
  rose: {
    base: "#f43f5e",
    heavy: "#e11d48",
    soft: "rgba(244, 63, 94, 0.1)",
    fg: "#ffffff",
    ring: "rgba(244, 63, 94, 0.25)",
    glow: "rgba(244, 63, 94, 0.6)",
  },
  violet: {
    base: "#8b5cf6",
    heavy: "#7c3aed",
    soft: "rgba(139, 92, 246, 0.1)",
    fg: "#ffffff",
    ring: "rgba(139, 92, 246, 0.25)",
    glow: "rgba(139, 92, 246, 0.6)",
  },
  cyan: {
    base: "#06b6d4",
    heavy: "#0891b2",
    soft: "rgba(6, 182, 212, 0.1)",
    fg: "#000000",
    ring: "rgba(6, 182, 212, 0.25)",
    glow: "rgba(6, 182, 212, 0.6)",
  },
}

export const ACCENT_COLOR_NAMES: AccentColorName[] = ["indigo", "emerald", "amber", "rose", "violet", "cyan"]

export const ACCENT_STORAGE_KEY = "accent-color"

export function applyAccentPalette(palette: AccentPalette): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty("--accent-base", palette.base)
  root.style.setProperty("--accent-heavy", palette.heavy)
  root.style.setProperty("--accent-soft", palette.soft)
  root.style.setProperty("--accent-fg", palette.fg)
  root.style.setProperty("--accent-ring", palette.ring)
  root.style.setProperty("--accent-glow", palette.glow)
}
