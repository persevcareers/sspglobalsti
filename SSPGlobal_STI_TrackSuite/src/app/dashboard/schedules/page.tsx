"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { DailySchedule, EventType, EventStatusV2, ActivityLogEntry, RecurrenceConfig, defaultRecurrence } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventForm } from "@/components/forms/EventForm";
import { NotificationCenter } from "@/components/events/NotificationCenter";
import { ActivityTimeline } from "@/components/events/ActivityTimeline";
import { DataTable, Column } from "@/components/tables/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { fadeIn } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { EVENT_TYPES, EVENT_TYPE_COLORS } from "@/constants";
import { useNotificationStore } from "@/stores/notificationStore";
import { modifySheetData } from "@/services/api";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@clerk/nextjs";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { parseToISTDateObject, formatToISTTime } from "@/utils/dateUtils";
import {
  Plus, Pencil, Trash2, MoreHorizontal, Search,
  CalendarDays, Clock, CheckCircle2, List, LayoutGrid,
  GraduationCap, Users, Handshake, UserCheck, Wrench,
  Monitor, MessageCircle, Play, Calendar,
  Bell, Copy, ExternalLink, Activity, RotateCcw, AlertTriangle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map((et) => [et.value, et.label])
);

const EVENT_ICONS: Record<string, typeof Calendar> = {
  "Training Session": GraduationCap,
  "Internal Meeting": Users,
  "Client Meeting": Handshake,
  "Interview": UserCheck,
  "Workshop": Wrench,
  "Webinar": Monitor,
  "Team Sync": MessageCircle,
  "Demo Session": Play,
  "Custom Event": Calendar,
};

function logId(): string {
  return "log_" + Math.random().toString(36).substring(2, 11);
}

function generateRecurringDates(baseDate: string, config: RecurrenceConfig, maxCount: number = 12): string[] {
  if (config.pattern === "none" || !config.pattern) return [];
  const dates: string[] = [];
  const start = new Date(baseDate + "T12:00:00");
  if (isNaN(start.getTime())) return [];
  const endAfter = config.endAfter || maxCount;
  let count = 0;
  let cursor = new Date(start);
  while (count < endAfter) {
    cursor = new Date(cursor);
    switch (config.pattern) {
      case "daily": cursor.setDate(cursor.getDate() + 1); break;
      case "weekdays":
        cursor.setDate(cursor.getDate() + 1);
        while (cursor.getDay() === 0 || cursor.getDay() === 6) cursor.setDate(cursor.getDate() + 1);
        break;
      case "weekly": cursor.setDate(cursor.getDate() + 7); break;
      case "biweekly": cursor.setDate(cursor.getDate() + 14); break;
      case "monthly": cursor.setMonth(cursor.getMonth() + 1); break;
      default: return dates;
    }
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    count++;
  }
  return dates;
}

const BATCH_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
  "#a855f7", "#0ea5e9",
];

function getBatchColor(batchName: string): string {
  let hash = 0;
  for (let i = 0; i < batchName.length; i++) {
    hash = batchName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BATCH_COLORS[Math.abs(hash) % BATCH_COLORS.length];
}

const STATUS_CLASSES: Record<string, string> = {
  Scheduled: "fc-event-scheduled",
  Running: "fc-event-running",
  Ongoing: "fc-event-running",
  Completed: "fc-event-completed",
  Cancelled: "fc-event-cancelled",
  Holiday: "fc-event-holiday",
  Postponed: "fc-event-postponed",
  PAP: "fc-event-pap",
};

export default function SchedulesPage() {
  const { data: schedules, isLoading, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<DailySchedule>("DailySchedules");
  const { data: activityLogs, refresh: refreshLogs } = useSheetsData<ActivityLogEntry>("ActivityLogs");

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DailySchedule | null>(null);
  const [detailSchedule, setDetailSchedule] = useState<DailySchedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailySchedule | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline" | "activity" | "calendar">("table");
  const [duplicateTarget, setDuplicateTarget] = useState<DailySchedule | null>(null);
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [calTitle, setCalTitle] = useState("");
  const calRef = useRef<FullCalendar>(null);
  const { user } = useUser();
  const { createNotification } = useNotifications();

  const {
    checkAndUpdateAutoStatus,
    sendBrowserNotification,
    sendToast,
    addNotification,
    requestPermission,
    startPolling,
    runReminderCycle,
    sendNotificationTriple,
  } = useNotificationStore();

  // Auto-status update every 60s
  useEffect(() => {
    const timer = setInterval(async () => {
      const updates = checkAndUpdateAutoStatus(schedules);
      for (const u of updates) {
        await updateRecord({ "Task ID": u.id, Status: u.status as EventStatusV2 });
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [schedules, updateRecord, checkAndUpdateAutoStatus]);

  // Reminder polling
  useEffect(() => {
    const cleanup = startPolling(schedules);
    return cleanup;
  }, [schedules, startPolling]);

  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of schedules) {
      const et = s["Event Type"] || "Training Session";
      counts[et] = (counts[et] || 0) + 1;
    }
    return counts;
  }, [schedules]);

  const filtered = useMemo(() => {
    let result = [...schedules];
    if (typeFilter !== "all") result = result.filter((s) => (s["Event Type"] || "Training Session") === typeFilter);
    if (statusFilter !== "all") result = result.filter((s) => s.Status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          (s.Title || s["Batch Name"] || "")?.toLowerCase().includes(q) ||
          s.Notes?.toLowerCase().includes(q) ||
          s.Organizer?.toLowerCase().includes(q) ||
          s["Meeting Link"]?.toLowerCase().includes(q)
      );
    }
    if (dateFilter === "today") {
      const today = new Date().toISOString().split("T")[0];
      result = result.filter((s) => (s["Schedule Date"] || "").startsWith(today));
    }
    return result;
  }, [schedules, typeFilter, statusFilter, searchTerm, dateFilter]);

  const totalStats = useMemo(() => ({
    total: schedules.length,
    completed: schedules.filter((s) => s.Status === "Completed").length,
    ongoing: schedules.filter((s) => s.Status === "Running" || s.Status === "Ongoing").length,
    scheduled: schedules.filter((s) => s.Status === "Scheduled").length,
  }), [schedules]);

  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return schedules.filter((s) => (s["Schedule Date"] || "").startsWith(today));
  }, [schedules]);

  // Conflict detector
  const conflicts = useMemo(() => {
    const result: { id: string; title: string; conflictWith: string[] }[] = [];
    for (let i = 0; i < schedules.length; i++) {
      const a = schedules[i];
      if (!a["Schedule Date"] || !a["Start Time"] || !a["End Time"]) continue;
      if (a.Status === "Cancelled" || a.Status === "Completed") continue;
      const conflicting: string[] = [];
      for (let j = 0; j < schedules.length; j++) {
        if (i === j) continue;
        const b = schedules[j];
        if (b.Status === "Cancelled" || b.Status === "Completed") continue;
        if (a["Schedule Date"] !== b["Schedule Date"]) continue;
        if (a["Start Time"] < b["End Time"] && b["Start Time"] < a["End Time"]) {
          conflicting.push(b.Title || b["Batch Name"] || "Untitled");
        }
      }
      if (conflicting.length > 0) {
        result.push({ id: a["Task ID"], title: a.Title || a["Batch Name"] || "Untitled", conflictWith: conflicting });
      }
    }
    return result;
  }, [schedules]);

  const handleSave = useCallback(async (data: Partial<DailySchedule>) => {
    const isEdit = !!editingSchedule;
    let ok = false;

    if (isEdit) {
      ok = await updateRecord({ ...data, "Task ID": editingSchedule!["Task ID"] });
    } else {
      ok = await createRecord(data);

      // Generate recurring instances
      if (data.Recurrence) {
        try {
          const recConfig: RecurrenceConfig = JSON.parse(data.Recurrence);
          if (recConfig.pattern !== "none" && data["Schedule Date"]) {
            const dates = generateRecurringDates(data["Schedule Date"], recConfig);
            for (const date of dates) {
              await createRecord({
                ...data,
                "Schedule Date": date,
                Recurrence: JSON.stringify(defaultRecurrence()),
              });
            }
            if (dates.length > 0) {
              toast.success(`Created ${dates.length} recurring event${dates.length > 1 ? "s" : ""}`);
            }
          }
        } catch { /* invalid JSON, skip */ }
      }
    }

    if (ok) {
      setIsDialogOpen(false);
      setEditingSchedule(null);

      const title = data.Title || data["Batch Name"] || "Event";
      const action = isEdit ? "updated" : "created";

      // Log activity
      const now = new Date().toISOString();
      await modifySheetData("create", "ActivityLogs", {
        "Log ID": logId(),
        "Event ID": editingSchedule?.["Task ID"] || data["Task ID"] || "",
        "Action": action,
        "Details": `${title} was ${action}`,
        "Timestamp (IST)": now,
        "Event Title": title,
        "Event Type": data["Event Type"] || "Training Session",
      });
      refreshLogs();

      const toastMsg = isEdit ? `"${title}" updated` : `"${title}" created`;

      // In-app notification (local)
      addNotification({
        id: "ntf_" + Math.random().toString(36).substring(2, 11),
        eventId: data["Task ID"] || "",
        title: isEdit ? "✏️ Event Updated" : "📅 Event Created",
        message: toastMsg,
        type: isEdit ? "event_updated" : "event_created",
        priority: "medium",
        isRead: false,
        createdAt: new Date().toISOString(),
        eventTitle: title,
      });

      // Toast
      sendToast(isEdit ? "Event Updated" : "Event Created", toastMsg, isEdit ? "event_updated" : "event_created");

      // Browser notification
      requestPermission().then((granted) => {
        if (granted) {
          sendBrowserNotification(
            isEdit ? "✏️ Event Updated" : "📅 Event Created",
            toastMsg
          );
        }
      });

      // Persist to global Notifications sheet
      if (user?.id) {
        createNotification({
          userId: user.id,
          title: isEdit ? "✏️ Event Updated" : "📅 Event Created",
          message: toastMsg,
          category: "schedule",
          priority: "medium",
          sourceModule: "schedule",
          actionUrl: `/dashboard/schedules?event=${data["Task ID"] || ""}`,
        });
      }
    }
  }, [editingSchedule, updateRecord, createRecord, refreshLogs, sendToast, sendBrowserNotification, requestPermission, addNotification, user, createNotification]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const title = deleteTarget.Title || deleteTarget["Batch Name"] || "Event";
    await deleteRecord({ "Task ID": deleteTarget["Task ID"] });
    setDeleteTarget(null);

    await modifySheetData("create", "ActivityLogs", {
      "Log ID": logId(),
      "Event ID": deleteTarget["Task ID"],
      "Action": "deleted",
      "Details": `"${title}" was deleted`,
      "Timestamp (IST)": new Date().toISOString(),
      "Event Title": title,
      "Event Type": deleteTarget["Event Type"] || "Training Session",
    });
    refreshLogs();

    sendNotificationTriple("🗑️ Event Deleted", `"${title}" was deleted`, "event_cancelled", deleteTarget["Task ID"], title);

    if (user?.id) {
      createNotification({
        userId: user.id,
        title: "🗑️ Event Deleted",
        message: `"${title}" was deleted`,
        category: "schedule",
        priority: "high",
        sourceModule: "schedule",
      });
    }
  }, [deleteTarget, deleteRecord, refreshLogs, sendNotificationTriple, user, createNotification]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateTarget) return;
    const copied: Partial<DailySchedule> = {
      "Event Type": duplicateTarget["Event Type"],
      "Title": (duplicateTarget.Title || duplicateTarget["Batch Name"] || "Event") + " (Copy)",
      "Schedule Date": duplicateTarget["Schedule Date"],
      "Start Time": duplicateTarget["Start Time"],
      "End Time": duplicateTarget["End Time"],
      "Status": "Scheduled",
      "Duration": duplicateTarget.Duration,
      "Organizer": duplicateTarget.Organizer,
      "Meeting Link": duplicateTarget["Meeting Link"],
      "Participants": duplicateTarget.Participants,
      "Location": duplicateTarget.Location,
      "Agenda": duplicateTarget.Agenda,
      "Notes": duplicateTarget.Notes,
      "Batch Name": duplicateTarget["Batch Name"],
      Reminders: duplicateTarget.Reminders,
    };
    await createRecord(copied);
    setDuplicateTarget(null);
    sendToast("Event Duplicated", `"${copied.Title}" created`, "event_created");
    refresh();
  }, [duplicateTarget, createRecord, sendToast, refresh]);

  const handleCopyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied");
  };

  const columns: Column<DailySchedule>[] = [
    {
      key: "Title",
      label: "Event",
      render: (s) => {
        const title = s.Title || s["Batch Name"] || "Untitled";
        const et = (s["Event Type"] || "Training Session") as EventType;
        const Icon = EVENT_ICONS[et] || Calendar;
        const hasConflict = conflicts.find((c) => c.id === s["Task ID"]);
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br",
              EVENT_TYPE_COLORS[et] || "from-gray-500/10 to-slate-500/10"
            )}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium leading-tight">{title}</p>
                {hasConflict && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-medium text-rose-500">
                    Conflict
                  </span>
                )}
              </div>
              {s.Organizer && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.Organizer}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "Event Type",
      label: "Type",
      render: (s) => {
        const et = s["Event Type"] || "Training Session";
        return (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
            EVENT_TYPE_COLORS[et]?.replace("bg-gradient-to-br ", "") || ""
          )}>
            {et}
          </span>
        );
      },
    },
    { key: "Schedule Date", label: "Date", render: (s) => <span className="text-sm text-muted-foreground">{s["Schedule Date"] || "—"}</span> },
    { key: "Start Time", label: "Time", render: (s) => <span className="text-sm">{s["Start Time"] || "—"}</span> },
    { key: "Duration", label: "Duration", render: (s) => <span className="text-sm text-muted-foreground">{s.Duration || "—"}</span> },
    {
      key: "Reminders",
      label: "Reminders",
      render: (s) => {
        const reminders = String(s.Reminders || "").split(",").filter(Boolean);
        if (reminders.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Bell className="h-3 w-3" />
            {reminders.length}
          </span>
        );
      },
    },
    {
      key: "Status",
      label: "Status",
      render: (s) => <StatusBadge status={s.Status} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      cellClass: "text-right",
      render: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => { setDetailSchedule(s); }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingSchedule(s); setIsDialogOpen(true); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setDuplicateTarget(s); }}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
            </DropdownMenuItem>
            {s["Meeting Link"] && (
              <DropdownMenuItem onClick={() => handleCopyMeetingLink(s["Meeting Link"]!)}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Copy Link
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setEditingSchedule(s); setIsDialogOpen(true); }}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reschedule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(s)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const timelineSchedules = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const grouped: Record<string, DailySchedule[]> = {};
    filtered.forEach((s) => {
      const date = s["Schedule Date"] || "";
      let group: string;
      if (!date) group = "Unknown";
      else if (date === todayStr) group = "Today";
      else if (new Date(date) > today) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        group = date === tomorrow.toISOString().split("T")[0] ? "Tomorrow" : "Upcoming";
      } else group = "Past";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(s);
    });
    const order = ["Today", "Tomorrow", "Upcoming", "Past", "Unknown"];
    const result: { group: string; schedules: DailySchedule[] }[] = [];
    order.forEach((g) => { if (grouped[g]) result.push({ group: g, schedules: grouped[g] }); });
    return result;
  }, [filtered]);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Events & Scheduling"
        description="Enterprise event management with smart notifications and reminders."
        action={
          <div className="flex shrink-0 items-center gap-2">
            <NotificationCenter />
            <div className="flex items-center rounded-lg border bg-card p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", viewMode === "table" ? "bg-accent-soft text-accent-base" : "text-muted-foreground hover:text-foreground")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", viewMode === "timeline" ? "bg-accent-soft text-accent-base" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", viewMode === "calendar" ? "bg-accent-soft text-accent-base" : "text-muted-foreground hover:text-foreground")}
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("activity")}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", viewMode === "activity" ? "bg-accent-soft text-accent-base" : "text-muted-foreground hover:text-foreground")}
              >
                <Activity className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={refresh}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingSchedule(null); }}>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </Button>
              <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSchedule ? "Edit Event" : "Create Event"}</DialogTitle>
                  <DialogDescription>
                    {editingSchedule ? "Update event details, schedule, and reminders." : "Schedule a new event with smart reminders."}
                  </DialogDescription>
                </DialogHeader>
                <EventForm
                  initialData={editingSchedule}
                  onSave={handleSave}
                  onCancel={() => { setIsDialogOpen(false); setEditingSchedule(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Event Type Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
            typeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          All Events
          <span className="ml-1.5 opacity-70">({schedules.length})</span>
        </button>
        {EVENT_TYPES.map((et) => {
          const count = eventTypeCounts[et.value] || 0;
          const Icon = EVENT_ICONS[et.value] || Calendar;
          return (
            <button
              key={et.value}
              onClick={() => setTypeFilter(et.value)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
                typeFilter === et.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3 w-3" />
              {et.label}
              <span className="ml-0.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
            <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{totalStats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total Events</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{totalStats.completed}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{totalStats.ongoing}</p>
            <p className="text-[10px] text-muted-foreground">Ongoing</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
            <Bell className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{conflicts.length}</p>
            <p className="text-[10px] text-muted-foreground">Conflicts</p>
          </div>
        </div>
      </div>

      {/* Today's Events Bar */}
      {todayEvents.length > 0 && (
        <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-3 flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Today&apos;s Events</p>
            <p className="text-xs text-muted-foreground">{todayEvents.length} event{todayEvents.length > 1 ? "s" : ""} scheduled today</p>
          </div>
          <div className="flex gap-1.5">
            {todayEvents.slice(0, 5).map((e) => (
              <span key={e["Task ID"]} className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-medium border",
                EVENT_TYPE_COLORS[e["Event Type"] || "Training Session"]?.replace("bg-gradient-to-br ", "") || ""
              )}>
                {e["Start Time"]}
              </span>
            ))}
            {todayEvents.length > 5 && (
              <span className="rounded-full px-2 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground">
                +{todayEvents.length - 5}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Conflicts Warning */}
      {conflicts.length > 0 && viewMode !== "activity" && viewMode !== "calendar" && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {conflicts.length} overlapping event{conflicts.length > 1 ? "s" : ""} detected
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Some events have overlapping schedules. Review and adjust to avoid conflicts.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events, organizer, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Running">Running</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Postponed">Postponed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {viewMode === "calendar" ? (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden calendar-premium">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => { calRef.current?.getApi()?.prev(); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-sm font-semibold min-w-[180px] text-center">{calTitle}</h3>
              <Button variant="ghost" size="icon" onClick={() => { calRef.current?.getApi()?.next(); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="ml-2 h-7 text-xs" onClick={() => { calRef.current?.getApi()?.today(); }}>
                Today
              </Button>
            </div>
            <div className="flex items-center rounded-lg border bg-card p-0.5">
              {[
                { v: "dayGridMonth", l: "Month" },
                { v: "timeGridWeek", l: "Week" },
                { v: "timeGridDay", l: "Day" },
                { v: "listWeek", l: "Agenda" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => { setCalendarView(opt.v); calRef.current?.getApi()?.changeView(opt.v); }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    calendarView === opt.v ? "bg-accent-soft text-accent-base" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <FullCalendar
              ref={calRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={filtered.map((s) => {
                const startDate = parseToISTDateObject(s["Schedule Date"] || "", s["Start Time"] || "");
                const endDate = s["End Time"]
                  ? parseToISTDateObject(s["Schedule Date"] || "", s["End Time"] || "")
                  : startDate ? new Date(startDate.getTime() + 3600000) : new Date();
                const color = getBatchColor(s["Batch Name"] || s.Title || "");
                return {
                  id: s["Task ID"] || "",
                  title: s.Title || s["Batch Name"] || "Untitled",
                  start: startDate?.toISOString() || new Date().toISOString(),
                  end: endDate?.toISOString() || new Date().toISOString(),
                  backgroundColor: color + "22",
                  borderColor: color,
                  classNames: [STATUS_CLASSES[s.Status] || "", "fc-event-custom"],
                  extendedProps: { ...s },
                };
              })}
              datesSet={(arg: DatesSetArg) => setCalTitle(arg.view.title)}
              eventClick={(arg: EventClickArg) => {
                const props = arg.event.extendedProps as unknown as DailySchedule;
                setDetailSchedule(props);
              }}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              timeZone="Asia/Kolkata"
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZoneName: "short",
              }}
            />
          )}
        </div>
      ) : viewMode === "activity" ? (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Activity Timeline</h3>
          </div>
          <ActivityTimeline logs={activityLogs} isLoading={isLoading} />
        </div>
      ) : viewMode === "table" ? (
        <DataTable<DailySchedule>
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          onRetry={refresh}
          searchFields={[]}
          searchPlaceholder="Search events..."
          emptyTitle="No events found"
          emptyDescription={
            typeFilter !== "all"
              ? `No ${EVENT_TYPE_LABELS[typeFilter] || typeFilter} events scheduled yet.`
              : "No events scheduled yet."
          }
          emptyAction={
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          }
          rowKey={(s) => s["Task ID"] || Math.random().toString()}
          pageSize={10}
        />
      ) : (
        <div className="space-y-6">
          {timelineSchedules.map(({ group, schedules: groupSchedules }) => (
            <div key={group}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  group === "Today" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                  group === "Tomorrow" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                  group === "Upcoming" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                  "bg-muted text-muted-foreground"
                )}>
                  {group}
                </span>
                <span className="text-xs text-muted-foreground">{groupSchedules.length} event{groupSchedules.length !== 1 ? "s" : ""}</span>
              </h3>
              <div className="space-y-2">
                {groupSchedules.map((s) => {
                  const et = (s["Event Type"] || "Training Session") as EventType;
                  const Icon = EVENT_ICONS[et] || Calendar;
                  const colorClass = EVENT_TYPE_COLORS[et] || "from-gray-500/10 to-slate-500/10";
                  return (
                    <motion.div
                      key={s["Task ID"]}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setDetailSchedule(s)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") setDetailSchedule(s); }}
                      role="button"
                      aria-label={`View details for ${s.Title || s["Batch Name"]}`}
                    >
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br", colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.Title || s["Batch Name"] || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {s["Start Time"]} — {s["End Time"]} {s["Schedule Date"] ? `| ${s["Schedule Date"]}` : ""}
                        </p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0",
                        EVENT_TYPE_COLORS[et]?.replace("bg-gradient-to-br ", "") || ""
                      )}>
                        {et}
                      </span>
                      <StatusBadge status={s.Status} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duplicate Confirmation */}
      <ConfirmDialog
        open={!!duplicateTarget}
        onOpenChange={(o) => { if (!o) setDuplicateTarget(null); }}
        title="Duplicate Event"
        description={`Create a copy of "${duplicateTarget?.Title || duplicateTarget?.["Batch Name"] || "Event"}"?`}
        onConfirm={handleDuplicate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Event"
        description={
          <>
            Are you sure you want to delete <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.Title || deleteTarget?.["Batch Name"]}&rdquo;</span>? This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
      />

      {/* Detail Sheet */}
      <Sheet open={!!detailSchedule} onOpenChange={(o) => { if (!o) setDetailSchedule(null); }}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detailSchedule?.Title || detailSchedule?.["Batch Name"] || "Event Details"}</SheetTitle>
            <SheetDescription>Task ID: {detailSchedule?.["Task ID"]}</SheetDescription>
          </SheetHeader>
          {detailSchedule && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={detailSchedule.Status} />
                {(detailSchedule.Status === "Running" || detailSchedule.Status === "Ongoing") && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />LIVE
                  </span>
                )}
                <span className={cn(
                  "text-[10px] font-medium rounded-full px-2 py-0.5 border",
                  EVENT_TYPE_COLORS[detailSchedule["Event Type"] || "Training Session"]?.replace("bg-gradient-to-br ", "") || ""
                )}>
                  {detailSchedule["Event Type"] || "Training Session"}
                </span>
              </div>

              {detailSchedule["Meeting Link"] && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 border border-primary/10">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <a href={detailSchedule["Meeting Link"]} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex-1 truncate">
                    Join Meeting
                  </a>
                  <button
                    onClick={() => handleCopyMeetingLink(detailSchedule["Meeting Link"]!)}
                    className="rounded-md p-1 hover:bg-muted transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-semibold mt-1">{detailSchedule["Schedule Date"]}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Time</p><p className="text-sm font-semibold mt-1">{detailSchedule["Start Time"]} — {detailSchedule["End Time"] || "ongoing"}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Duration</p><p className="text-sm font-semibold mt-1">{detailSchedule.Duration || "—"}</p></div>
                {detailSchedule.Reminders && (
                  <div className="rounded-lg bg-card p-3 border">
                    <p className="text-xs text-muted-foreground">Reminders</p>
                    <p className="text-sm font-semibold mt-1">
                      {String(detailSchedule.Reminders).split(",").map(Number).filter((n) => !isNaN(n)).length} set
                    </p>
                  </div>
                )}
                {detailSchedule.Title && <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Title</p><p className="text-sm font-semibold mt-1">{detailSchedule.Title}</p></div>}
                {detailSchedule.Organizer && <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Organizer</p><p className="text-sm font-semibold mt-1">{detailSchedule.Organizer}</p></div>}
                {detailSchedule.Participants && <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Participants</p><p className="text-sm font-semibold mt-1">{detailSchedule.Participants}</p></div>}
                {detailSchedule.Location && <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Location</p><p className="text-sm font-semibold mt-1">{detailSchedule.Location}</p></div>}
              </div>

              {detailSchedule.Agenda && (
                <div><h4 className="text-sm font-semibold mb-2">Agenda</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailSchedule.Agenda}</p></div>
              )}
              {detailSchedule.Notes && (
                <div><h4 className="text-sm font-semibold mb-2">Notes</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailSchedule.Notes}</p></div>
              )}
              <div>
                <h4 className="text-sm font-semibold mb-2">History</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Last Updated</span><span>{detailSchedule["Last Updated Timestamp (IST)"] || "—"}</span></div>
                  <div className="flex justify-between"><span>Created</span><span>{detailSchedule["Created Time (IST)"] || "—"}</span></div>
                  <div className="flex justify-between"><span>Last Status Change</span><span>{detailSchedule["Last Status Change Time (IST)"] || "—"}</span></div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

