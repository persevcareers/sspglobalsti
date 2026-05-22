"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useUser, UserButton, Show } from "@clerk/nextjs";
import type { AppNotification, NotificationCategory, NotificationPriority } from "@/types";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
} from "@/constants";
import {
  Menu,
  Moon,
  Sun,
  Bell,
  User,
  CheckCheck,
  Info,
  Calendar,
  Settings,
  Shield,
  GraduationCap,
  Users,
  Inbox,
  ClipboardCheck,
  Layers,
  Target,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

interface NavbarProps {
  onMenuClick: () => void;
}

const categoryIconMap: Record<string, React.ReactNode> = {
  security: <Shield className="h-4 w-4" />,
  attendance: <ClipboardCheck className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
  schedule: <Calendar className="h-4 w-4" />,
  batch: <Layers className="h-4 w-4" />,
  lead: <Target className="h-4 w-4" />,
  student: <Users className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

function getNotifCategoryIcon(category: string): React.ReactNode {
  return categoryIconMap[category] || <Info className="h-4 w-4" />;
}

const IST_MS = 5.5 * 60 * 60 * 1000;

function toISTDate(iso: string): Date {
  return new Date(new Date(iso).getTime() + IST_MS);
}

function getISTDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function istDatePart(iso: string): string {
  return getISTDateString(toISTDate(iso));
}

function formatTime(iso: string): string {
  const ist = toISTDate(iso);
  const nowIST = new Date(Date.now() + IST_MS);
  const diff = nowIST.getTime() - ist.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  const day = ist.getDate();
  const dayName = ist.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = ist.toLocaleDateString("en-US", { month: "long" });
  const year = ist.getFullYear();
  return `${day}, ${dayName}, ${monthName} ${year}`;
}

function isToday(iso: string): boolean {
  return istDatePart(iso) === getISTDateString(new Date(Date.now() + IST_MS));
}

function isYesterday(iso: string): boolean {
  const yesterday = new Date(Date.now() + IST_MS);
  yesterday.setDate(yesterday.getDate() - 1);
  return istDatePart(iso) === getISTDateString(yesterday);
}

function NotificationGroup({
  label,
  items,
  onRead,
}: {
  label: string;
  items: Array<{ notif: import("@/types").AppNotification; index: number }>;
  onRead: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="px-3 pb-1 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{label}</span>
      </div>
      {items.map(({ notif, index }) => {
        const unread = notif.status === "unread";
        const catColor = NOTIFICATION_CATEGORIES[notif.category as NotificationCategory]?.color || "text-accent-base";
        return (
          <motion.button
            key={notif.notificationId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            onClick={() => {
              if (unread) onRead(notif.notificationId);
              if (notif.actionUrl) window.location.href = notif.actionUrl;
            }}
            className={`relative flex w-full items-start gap-3 px-3 py-2.5 text-left transition-all duration-200 hover:bg-card-hover-bg ${
              unread ? "bg-card-hover-bg" : ""
            }`}
          >
            {unread && (
              <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent-base" style={{ boxShadow: "0 0 6px var(--accent-glow)" }} />
            )}
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              unread ? "bg-card-hover-bg" : "bg-card-hover-bg"
            } ${catColor}`}>
              {getNotifCategoryIcon(notif.category)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm leading-snug ${unread ? "font-semibold text-foreground" : "font-normal text-foreground/80"}`}>
                  {notif.title}
                </p>
                {notif.priority === "critical" && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]" />
                )}
                {notif.priority === "high" && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
                )}
              </div>
              <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground/70">
                {notif.message}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground/40">{formatTime(notif.createdAt)}</p>
                {notif.actionUrl && (
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/30" />
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isLoaded, user } = useUser();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const { today, yesterday, earlier } = useMemo(() => {
    const t: Array<{ notif: AppNotification; index: number }> = [];
    const y: Array<{ notif: AppNotification; index: number }> = [];
    const e: Array<{ notif: AppNotification; index: number }> = [];
    notifications.forEach((n) => {
      const item = { notif: n, index: 0 };
      if (isToday(n.createdAt)) t.push(item);
      else if (isYesterday(n.createdAt)) y.push(item);
      else e.push(item);
    });
    t.forEach((item, i) => item.index = i);
    y.forEach((item, i) => item.index = i);
    e.forEach((item, i) => item.index = i);
    return { today: t, yesterday: y, earlier: e };
  }, [notifications]);

  const hasGroups = today.length > 0 || yesterday.length > 0 || earlier.length > 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* Notifications */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>

        <AnimatePresence>
          {notifOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 z-50 mt-2 w-[420px] origin-top-right overflow-hidden rounded-2xl border border-border bg-popover/95 shadow-2xl shadow-black/40 backdrop-blur-xl md:w-[440px]"
                style={{ maxHeight: "min(500px, calc(100vh - 100px))" }}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-base">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={markAllAsRead}>
                        <CheckCheck className="h-3 w-3" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>

                <div className="scrollbar-thin overflow-y-auto" style={{ maxHeight: "440px" }}>
                  {loading ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-2 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !hasGroups ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-14 text-muted-foreground"
                    >
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-card-hover-bg">
                        <Inbox className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-medium text-foreground/80">You&apos;re all caught up</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/60">No new notifications</p>
                    </motion.div>
                  ) : (
                    <>
                      <NotificationGroup label="Today" items={today} onRead={markAsRead} />
                      <NotificationGroup label="Yesterday" items={yesterday} onRead={markAsRead} />
                      <NotificationGroup label="Earlier" items={earlier} onRead={markAsRead} />
                      <div className="h-2" />
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Theme */}
      <DropdownMenuSimple
        trigger={
          <Button variant="ghost" size="icon">
            {mounted && theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        }
        items={[
          { label: "Light", onClick: () => setTheme("light") },
          { label: "Dark", onClick: () => setTheme("dark") },
          { label: "System", onClick: () => setTheme("system") },
        ]}
      />

      {/* User */}
      <div className="flex items-center gap-2">
        {!isLoaded ? (
          <>
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </>
        ) : (
          <>
            <Show when="signed-in">
              <span className="hidden text-sm font-medium md:block">
                {user?.fullName || user?.username || "User"}
              </span>
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8" },
                }}
              />
            </Show>
            <Show when="signed-out">
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </Show>
          </>
        )}
      </div>
    </header>
  );
}

function DropdownMenuSimple({
  trigger,
  items,
}: {
  trigger: React.ReactNode;
  items: { label: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              className="absolute right-0 z-50 mt-2 w-32 overflow-hidden rounded-xl border border-border bg-popover/95 p-1 shadow-xl shadow-black/30 backdrop-blur-xl"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-card-hover-bg hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
