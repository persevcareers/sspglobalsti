"use client";

import { useSettingsContext } from "@/contexts/SettingsContext";

export function useReducedMotion() {
  const { settings } = useSettingsContext();
  return settings.reducedMotion;
}
