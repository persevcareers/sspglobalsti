"use client"

import { useContext } from "react"
import { AccentThemeContext } from "@/contexts/AccentThemeContext"

export function useAccentTheme() {
  const context = useContext(AccentThemeContext)
  if (!context) {
    throw new Error("useAccentTheme must be used within an AccentThemeProvider")
  }
  return context
}
