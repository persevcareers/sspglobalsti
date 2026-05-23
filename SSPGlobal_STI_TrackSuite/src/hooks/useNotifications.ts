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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const result = await callSessionAction<{
        notifications: AppNotification[];
        total: number;
        unreadCount: number;
      }>("getNotifications", {
        userId: user.id,
      });
      if (result.success && result.data) {
        const notifs = result.data.notifications || result.data as unknown as AppNotification[];
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
          const count = result.data.unreadCount ?? notifs.filter((n) => n.status === "unread").length;
          setUnreadCount(count);
          if (result.data.total) setTotalCount(result.data.total);

          const prevIds = prevUnreadIdsRef.current;
          if (prevIds.size > 0) {
            const newUnread = notifs.filter(
              (n) => n.status === "unread" && !prevIds.has(n.notificationId)
            );
            for (const notif of newUnread) {
              if (document.visibilityState !== "visible") {
                showDesktopNotification(notif);
              }
            }
          }
          prevUnreadIdsRef.current = new Set(
            notifs.filter((n) => n.status === "unread").map((n) => n.notificationId)
          );
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

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

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, status: "read" as const } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await callSessionAction("markNotificationRead", { notificationId });
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" as const }))
    );
    setUnreadCount(0);
    await callSessionAction("markAllNotificationsRead", { userId: user.id });
  };

  const archiveOld = async () => {
    if (!user?.id) return;
    await callSessionAction("archiveNotifications", { userId: user.id });
    fetchNotifications();
  };

  const createNotification = async (data: {
    userId: string;
    title: string;
    message: string;
    category?: string;
    priority?: string;
    actionUrl?: string;
    sourceModule?: string;
    actorId?: string;
  }) => {
    await callSessionAction("createNotification", data);
    fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    totalCount,
    loading,
    markAsRead,
    markAllAsRead,
    archiveOld,
    createNotification,
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
