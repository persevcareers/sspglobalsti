"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { callSessionAction } from "@/services/api";
import type { AppNotification } from "@/types";
import { NOTIFICATION_POLL_INTERVAL_MS } from "@/constants";

export function useNotifications() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const result = await callSessionAction<AppNotification[]>("getNotifications", {
        "User ID": user.id,
      });
      if (result.success && result.data) {
        setNotifications(result.data);
        const newUnreadCount = result.data.filter((n) => n["Is Read"] !== "TRUE").length;
        setUnreadCount(newUnreadCount);

        const prevIds = prevUnreadIdsRef.current;
        if (prevIds.size > 0) {
          const newUnread = result.data.filter(
            (n) => n["Is Read"] !== "TRUE" && !prevIds.has(n["Notification ID"])
          );
          for (const notif of newUnread) {
            if (document.visibilityState !== "visible") {
              showDesktopNotification(notif);
            }
          }
        }
        prevUnreadIdsRef.current = new Set(
          result.data.filter((n) => n["Is Read"] !== "TRUE").map((n) => n["Notification ID"])
        );
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isLoaded, isSignedIn, user]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n["Notification ID"] === notificationId ? { ...n, "Is Read": "TRUE" as const } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await callSessionAction("markNotificationRead", { "Notification ID": notificationId });
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, "Is Read": "TRUE" as const }))
    );
    setUnreadCount(0);
    await callSessionAction("markAllNotificationsRead", { "User ID": user.id });
  };

  const createNotification = async (data: {
    "User ID": string;
    Title: string;
    Message: string;
    Type: string;
    Link?: string;
  }) => {
    await callSessionAction("createNotification", data);
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refresh: fetchNotifications,
  };
}

function showDesktopNotification(notif: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(notif.Title, {
      body: notif.Message,
      icon: "/favicon.ico",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}
