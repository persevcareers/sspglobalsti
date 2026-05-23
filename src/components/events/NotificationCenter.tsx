"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/stores/notificationStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Info,
  X,
  Calendar,
  ChevronRight,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof Bell> = {
  reminder: Clock,
  status_change: Calendar,
  event_created: BellRing,
  event_updated: Bell,
  event_cancelled: X,
  event_rescheduled: Calendar,
  overdue: AlertTriangle,
  info: Info,
};

const TYPE_COLORS: Record<string, string> = {
  reminder: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  status_change: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  event_created: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  event_updated: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  event_cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  event_rescheduled: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
    clearNotifications,
    requestPermission,
    permission,
  } = useNotificationStore();

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (permission === "default") requestPermission();
  }, [permission, requestPermission]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border bg-popover shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.info;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "group relative flex items-start gap-3 border-b border-border/50 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/30",
                        !n.isRead && "bg-accent/5"
                      )}
                      onClick={() => markRead(n.id)}
                    >
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", colorClass)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs leading-snug", !n.isRead && "font-semibold")}>
                          {n.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t px-4 py-2">
                <button
                  onClick={() => { setOpen(false); }}
                  className="flex w-full items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  View All
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
