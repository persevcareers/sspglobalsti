"use client";

import { useSettingsContext } from "@/contexts/SettingsContext";

export function useCompactMode() {
  const { settings } = useSettingsContext();
  return settings.compactMode;
}
