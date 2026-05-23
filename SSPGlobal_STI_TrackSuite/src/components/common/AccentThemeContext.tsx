"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AccentColorName = "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";

interface AccentThemeContextType {
  accentColor: AccentColorName;
  setAccentColor: (color: AccentColorName) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
}

const AccentThemeContext = createContext<AccentThemeContextType | undefined>(undefined);

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColorName>("indigo");
  const [compactMode, setCompactModeState] = useState<boolean>(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedAccent = localStorage.getItem("accent-color") as AccentColorName;
    if (savedAccent && ["indigo", "emerald", "amber", "rose", "violet", "cyan"].includes(savedAccent)) {
      setAccentColorState(savedAccent);
      document.documentElement.setAttribute("data-accent", savedAccent);
    } else {
      document.documentElement.setAttribute("data-accent", "indigo");
    }

    const savedCompact = localStorage.getItem("compact-mode");
    if (savedCompact === "true") {
      setCompactModeState(true);
      document.documentElement.classList.add("compact-mode");
    } else {
      document.documentElement.classList.remove("compact-mode");
    }
  }, []);

  const setAccentColor = (color: AccentColorName) => {
    setAccentColorState(color);
    localStorage.setItem("accent-color", color);
    document.documentElement.setAttribute("data-accent", color);
  };

  const setCompactMode = (enabled: boolean) => {
    setCompactModeState(enabled);
    localStorage.setItem("compact-mode", enabled ? "true" : "false");
    if (enabled) {
      document.documentElement.classList.add("compact-mode");
    } else {
      document.documentElement.classList.remove("compact-mode");
    }
  };

  return (
    <AccentThemeContext.Provider value={{ accentColor, setAccentColor, compactMode, setCompactMode }}>
      {children}
    </AccentThemeContext.Provider>
  );
}

export function useAccentTheme() {
  const context = useContext(AccentThemeContext);
  if (!context) {
    throw new Error("useAccentTheme must be used within an AccentThemeProvider");
  }
  return context;
}
