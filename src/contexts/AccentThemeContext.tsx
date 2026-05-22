"use client"

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  ACCENT_COLORS,
  ACCENT_COLOR_NAMES,
  ACCENT_STORAGE_KEY,
  applyAccentPalette,
} from "@/constants/accent-colors"
import type { AccentColorName, AccentPalette } from "@/constants/accent-colors"

interface AccentThemeContextType {
  accentColor: AccentColorName
  accentPalette: AccentPalette
  setAccentColor: (name: AccentColorName) => void
  accentColors: typeof ACCENT_COLORS
  accentColorNames: AccentColorName[]
}

export const AccentThemeContext = createContext<AccentThemeContextType | null>(null)

function getInitialAccent(): AccentColorName {
  if (typeof window === "undefined") return "indigo"
  const stored = localStorage.getItem(ACCENT_STORAGE_KEY)
  if (stored && ACCENT_COLORS[stored as AccentColorName]) {
    return stored as AccentColorName
  }
  return "indigo"
}

export function AccentThemeProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColorName>(getInitialAccent)

  const setAccentColor = useCallback((name: AccentColorName) => {
    setAccentColorState(name)
    const palette = ACCENT_COLORS[name]
    applyAccentPalette(palette)
    localStorage.setItem(ACCENT_STORAGE_KEY, name)
  }, [])

  useEffect(() => {
    const palette = ACCENT_COLORS[accentColor]
    applyAccentPalette(palette)
  }, [accentColor])

  return (
    <AccentThemeContext.Provider
      value={{
        accentColor,
        accentPalette: ACCENT_COLORS[accentColor],
        setAccentColor,
        accentColors: ACCENT_COLORS,
        accentColorNames: ACCENT_COLOR_NAMES,
      }}
    >
      {children}
    </AccentThemeContext.Provider>
  )
}
