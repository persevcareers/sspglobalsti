"use client";

import { useSettingsContext } from "@/contexts/SettingsContext";

export function useSettings() {
  return useSettingsContext();
}
