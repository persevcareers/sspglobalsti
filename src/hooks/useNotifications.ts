"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { callSessionAction } from "@/services/api";
import type { AppNotification } from "@/types";
import { NOTIFICATION_POLL_INTERVAL_MS, NOTIFICATION_FETCH_LIMIT } from "@/constants";

export function useNotifications() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await callSessionAction<{
        notifications: AppNotification[];
        total: number;
        unreadCount: number;
      }>("getNotifications", {
        userId: user.id,
        limit: String(NOTIFICATION_FETCH_LIMIT),
        offset: "0",
      });
      if (result.success && result.data) {
        const fetched = result.data.notifications || [];
        setNotifications(fetched);
        setUnreadCount(result.data.unreadCount);

        const prevIds = prevUnreadIdsRef.current;
        if (prevIds.size > 0) {
          const newUnread = fetched.filter(
            (n) => n.status === "unread" && !prevIds.has(n.notificationId)
          );
          for (const notif of newUnread) {
            if (document.visibilityState !== "visible") {
              showDesktopNotification(notif);
            }
          }
        }
        prevUnreadIdsRef.current = new Set(
          fetched.filter((n) => n.status === "unread").map((n) => n.notificationId)
        );
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
  }, [isLoaded, isSignedIn, user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, status: "read" as const } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await callSessionAction("markNotificationRead", { notificationId });
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" as const }))
    );
    setUnreadCount(0);
    await callSessionAction("markAllNotificationsRead", { userId: user.id });
  }, [user?.id]);

  const createNotification = useCallback(async (notif: Partial<AppNotification>) => {
    await callSessionAction("createNotification", notif);
    fetchNotifications();
  }, [fetchNotifications]);

  const archiveOld = useCallback(async (olderThanDays = 30) => {
    if (!user?.id) return;
    await callSessionAction("archiveNotifications", {
      userId: user.id,
      olderThanDays: String(olderThanDays),
    });
    fetchNotifications();
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    archiveOld,
    refresh: fetchNotifications,
  };
}

function showDesktopNotification(notif: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(notif.title, {
      body: notif.message,
      icon: "/favicon.ico",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}
