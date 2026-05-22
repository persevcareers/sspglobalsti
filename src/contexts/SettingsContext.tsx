"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

export interface Settings {
  compactMode: boolean;
  reducedMotion: boolean;
  showWeekends: boolean;
  collapsedSidebar: boolean;
  showStatCards: boolean;
  showCharts: boolean;
  showOnlineUsers: boolean;
  showRecentActivity: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = "tracking-app-settings";
const DEFAULT_SETTINGS: Settings = {
  compactMode: false,
  reducedMotion: false,
  showWeekends: true,
  collapsedSidebar: false,
  showStatCards: true,
  showCharts: true,
  showOnlineUsers: true,
  showRecentActivity: true,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings, mounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.compact = String(settings.compactMode);
  }, [settings.compactMode]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      <MotionConfig reducedMotion={mounted && settings.reducedMotion ? "always" : "never"}>
        {children}
      </MotionConfig>
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider");
  return ctx;
}
