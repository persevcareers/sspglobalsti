"use client";

import { useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { callSessionAction } from "@/services/api";
import { ACTIVITY_TIMEOUT_MINUTES, HEARTBEAT_INTERVAL_MS } from "@/constants";

export function useActivityTracking() {
  const { isLoaded, isSignedIn, user } = useUser();
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const updateLastActive = useCallback(async () => {
    if (!userIdRef.current) return;

    try {
      await callSessionAction("updateLastActive", {
        "User ID": userIdRef.current,
      });
    } catch {
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    userIdRef.current = user.id;
    lastActivityRef.current = Date.now();

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    intervalRef.current = setInterval(() => {
      const inactiveMinutes = (Date.now() - lastActivityRef.current) / 60000;
      if (inactiveMinutes >= ACTIVITY_TIMEOUT_MINUTES) {
        return;
      }
      updateLastActive();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoaded, isSignedIn, user, updateLastActive]);
}
