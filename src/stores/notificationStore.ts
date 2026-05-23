import { create } from "zustand";
import { EventNotification, ReminderTime } from "@/types";
import { toast } from "sonner";

const REMINDER_LABELS: Record<ReminderTime, string> = {
  5: "5 minutes before",
  15: "15 minutes before",
  30: "30 minutes before",
  60: "1 hour before",
  1440: "1 day before",
};

const NOTIFICATION_CHECK_INTERVAL = 30000;

type ReminderEvent = {
  "Task ID": string;
  Title: string;
  "Schedule Date": string;
  "Start Time": string;
  "End Time": string;
  Status: string;
  Reminders: string;
  "Event Type": string;
};

interface NotificationStore {
  notifications: EventNotification[];
  unreadCount: number;
  permission: NotificationPermission;
  requested: boolean;
  pollingRef: ReturnType<typeof setInterval> | null;
  sentReminderKeys: Set<string>;

  addNotification: (n: EventNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  requestPermission: () => Promise<boolean>;
  sendBrowserNotification: (title: string, body: string, eventId?: string) => void;
  sendToast: (title: string, message: string, type?: EventNotification["type"]) => void;
  sendNotificationTriple: (title: string, message: string, type: EventNotification["type"], eventId: string, eventTitle: string) => void;
  runReminderCycle: (events: ReminderEvent[]) => void;
  checkAndUpdateAutoStatus: (events: ReminderEvent[]) => { id: string; status: string }[];
  startPolling: (events: ReminderEvent[]) => () => void;
  getReminderLabel: (minutes: number) => string;
}

function generateId(): string {
  return "ntf_" + Math.random().toString(36).substring(2, 11);
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  permission: "default",
  requested: false,
  pollingRef: null,
  sentReminderKeys: new Set(),

  getReminderLabel: (minutes: number) => REMINDER_LABELS[minutes as ReminderTime] || `${minutes} minutes before`,

  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  removeNotification: (id) =>
    set((state) => {
      const filtered = state.notifications.filter((n) => n.id !== id);
      const removed = state.notifications.find((n) => n.id === id);
      return {
        notifications: filtered,
        unreadCount: Math.max(0, state.unreadCount - (removed && !removed.isRead ? 1 : 0)),
      };
    }),

  requestPermission: async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      set({ permission: "granted", requested: true });
      return true;
    }
    if (Notification.permission === "denied") {
      set({ permission: "denied", requested: true });
      return false;
    }
    const result = await Notification.requestPermission();
    set({ permission: result, requested: true });
    return result === "granted";
  },

  sendBrowserNotification: (title, body, eventId) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const n = new Notification(title, {
        body,
        icon: "/icon.png",
        tag: eventId || generateId(),
      });
      if (eventId) {
        n.onclick = () => {
          window.focus();
          window.location.href = `/dashboard/schedules?event=${eventId}`;
        };
      }
      setTimeout(() => n.close(), 8000);
    } catch {
      // silently fail
    }
  },

  sendToast: (title, message, type = "info") => {
    const toastFn = type === "reminder" ? toast.info :
      type === "event_cancelled" ? toast.error :
      type === "overdue" ? toast.warning :
      type === "event_created" ? toast.success :
      toast.info;
    toastFn(title, { description: message, duration: 5000 });
  },

  sendNotificationTriple: (title, message, type, eventId, eventTitle) => {
    const { addNotification, sendToast, sendBrowserNotification, requestPermission } = get();
    addNotification({
      id: generateId(),
      eventId,
      title,
      message,
      type,
      priority: type === "reminder" || type === "overdue" ? "high" : "medium",
      isRead: false,
      createdAt: new Date().toISOString(),
      eventTitle,
    });
    sendToast(title, message, type);
    requestPermission().then((granted) => {
      if (granted) sendBrowserNotification(title, message, eventId);
    });
  },

  runReminderCycle: (events) => {
    const now = new Date();
    const { sendNotificationTriple, requestPermission, sentReminderKeys } = get();

    for (const event of events) {
      if (!event.Reminders || !event["Schedule Date"] || !event["Start Time"]) continue;
      if (event.Status === "Completed" || event.Status === "Cancelled") continue;

      const reminderMinutes = String(event.Reminders).split(",").map(Number).filter((n) => !isNaN(n));
      if (reminderMinutes.length === 0) continue;

      const eventDateTime = new Date(`${event["Schedule Date"]}T${event["Start Time"]}:00`);
      if (isNaN(eventDateTime.getTime())) continue;

      const timeUntilEvent = (eventDateTime.getTime() - now.getTime()) / 60000;

      for (const min of reminderMinutes) {
        const key = `${event["Task ID"]}_${min}`;
        if (sentReminderKeys.has(key)) continue;

        if (timeUntilEvent > 0 && timeUntilEvent <= min && timeUntilEvent > min - 2) {
          const label = REMINDER_LABELS[min as ReminderTime] || `${min} minutes before`;
          const title = `⏰ Reminder: ${event.Title}`;
          sendNotificationTriple(title, label, "reminder", event["Task ID"], event.Title);
          sentReminderKeys.add(key);
        }
      }

      // Overdue detection: event ended over 15 min ago and not completed
      const endDateTime = event["End Time"]
        ? new Date(`${event["Schedule Date"]}T${event["End Time"]}:00`)
        : null;
      if (endDateTime && !isNaN(endDateTime.getTime())) {
        const minsSinceEnd = (now.getTime() - endDateTime.getTime()) / 60000;
        const overdueKey = `overdue_${event["Task ID"]}`;
        if (minsSinceEnd > 15 && !sentReminderKeys.has(overdueKey)) {
          sendNotificationTriple(
            `⚠️ Overdue: ${event.Title}`,
            `Event ended ${Math.round(minsSinceEnd)} min ago and is still marked as ${event.Status}`,
            "overdue",
            event["Task ID"],
            event.Title
          );
          sentReminderKeys.add(overdueKey);
        }
      }
    }
  },

  checkAndUpdateAutoStatus: (events) => {
    const now = new Date();
    const updates: { id: string; status: string }[] = [];

    for (const event of events) {
      if (!event["Schedule Date"] || !event["Start Time"]) continue;
      const eventDate = new Date(`${event["Schedule Date"]}T${event["Start Time"]}:00`);
      if (isNaN(eventDate.getTime())) continue;

      const endDateTime = event["End Time"]
        ? new Date(`${event["Schedule Date"]}T${event["End Time"]}:00`)
        : null;

      const nowMs = now.getTime();
      const startMs = eventDate.getTime();
      const endMs = endDateTime?.getTime() || startMs + 3600000;

      if (event.Status === "Scheduled" && nowMs >= startMs && nowMs < endMs) {
        updates.push({ id: event["Task ID"], status: "Running" });
      } else if ((event.Status === "Scheduled" || event.Status === "Running") && nowMs >= endMs) {
        updates.push({ id: event["Task ID"], status: "Completed" });
      }
    }
    return updates;
  },

  startPolling: (events) => {
    const interval = setInterval(() => {
      get().runReminderCycle(events);
    }, NOTIFICATION_CHECK_INTERVAL);

    set({ pollingRef: interval });
    return () => {
      clearInterval(interval);
      set({ pollingRef: null });
    };
  },
}));
