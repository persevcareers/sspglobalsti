"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { DailySchedule, Batch, Trainer } from "@/types";
import { fetchSheetData, modifySheetData } from "@/services/api";
import {
  Search,
  Calendar,
  Clock,
  User,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Play,
  Ban,
  Sun,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAccentTheme } from "@/hooks/useAccentTheme";
import {
  parseToISTDateObject,
  formatToISTDate,
  formatToISTTime,
  calculateDuration,
  parseFormattedDate,
} from "@/utils/dateUtils";

const DEFAULT_BATCH_COLORS = [
  "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
  "#f97316", "#3b82f6", "#84cc16", "#a855f7",
];

const FIXED_STATUS_COLORS: Record<string, string> = {
  Running: "#10b981",
  Completed: "#6b7280",
  Cancelled: "#ef4444",
  Holiday: "#f59e0b",
  Postponed: "#8b5cf6",
  PAP: "#ec4899",
};

function getStatusIcon(status: string) {
  switch (status) {
    case "Running": return <Play className="h-3 w-3" />;
    case "Completed": return <CheckCircle2 className="h-3 w-3" />;
    case "Cancelled": return <Ban className="h-3 w-3" />;
    case "Holiday": return <Sun className="h-3 w-3" />;
    case "Postponed": return <RotateCcw className="h-3 w-3" />;
    case "PAP": return <AlertTriangle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
}

function parseTimeTo24h(timeStr: string): string {
  if (!timeStr) return "00:00";
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  const rawMatch = timeStr.match(/(\d+):(\d+)/);
  if (rawMatch) return timeStr;
  return "00:00";
}

function formatEventTime(startStr: string | undefined, endStr: string | undefined): string {
  if (!startStr) return "";
  const startDate = new Date(startStr);
  const startTime = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  if (!endStr) return startTime;
  const endDate = new Date(endStr);
  const endTime = endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  return `${startTime} – ${endTime}`;
}

export default function CalendarPage() {
  const { accentPalette } = useAccentTheme();
  const calendarRef = useRef<FullCalendar>(null);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DailySchedule | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("timeGridWeek");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [schedData, batchData, trainerData] = await Promise.all([
          fetchSheetData<DailySchedule>("DailySchedules"),
          fetchSheetData<Batch>("Batches"),
          fetchSheetData<Trainer>("Trainers"),
        ]);
        setSchedules(schedData);
        setBatches(batchData);
        setTrainers(trainerData);
      } catch (err) {
        toast.error("Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const batchNames = useMemo(() => {
    const names = new Set(schedules.map((s) => s["Batch Name"]).filter(Boolean));
    return Array.from(names);
  }, [schedules]);

  const batchColors = useMemo(() => {
    return [accentPalette.base, ...DEFAULT_BATCH_COLORS];
  }, [accentPalette.base]);

  const statusColors: Record<string, string> = useMemo(() => {
    return { ...FIXED_STATUS_COLORS, Scheduled: accentPalette.base };
  }, [accentPalette.base]);

  const getBatchColor = useCallback((batchName: string, index: number): string => {
    return batchColors[index % batchColors.length];
  }, [batchColors]);

  const events = useMemo(() => {
    return schedules
      .filter((s) => s["Schedule Date"] && s["Start Time"])
      .map((s, idx) => {
        const batchIdx = batchNames.indexOf(s["Batch Name"]);
        const batchColor = getBatchColor(s["Batch Name"], batchIdx);
        const start = parseToISTDateObject(s["Schedule Date"], s["Start Time"]);
        const end = s["End Time"] ? parseToISTDateObject(s["Schedule Date"], s["End Time"]) : null;
        if (!start) return null;

        const endDate = end || new Date(start.getTime() + 60 * 60 * 1000);

        return {
          id: s["Task ID"],
          title: s["Batch Name"],
          start: start.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: batchColor,
          borderColor: batchColor,
          textColor: "#fff",
          classNames: [`status-${(s.Status || "Scheduled").toLowerCase()}`],
          extendedProps: {
            taskId: s["Task ID"],
            batchName: s["Batch Name"],
            status: s.Status || "Scheduled",
            startTime: s["Start Time"],
            endTime: s["End Time"],
            duration: s.Duration || calculateDuration(s["Start Time"], s["End Time"] || ""),
            notes: s.Notes || "",
            scheduleDate: s["Schedule Date"],
          },
        };
      })
      .filter(Boolean);
  }, [schedules, batchNames]);

  const filteredEvents = useMemo(() => {
    if (trainerFilter === "all" && !searchQuery) return events;
    return events.filter((ev: any) => {
      const batch = ev.extendedProps.batchName?.toLowerCase() || "";
      const notes = ev.extendedProps.notes?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      if (searchQuery && !batch.includes(query) && !notes.includes(query)) return false;
      if (trainerFilter !== "all" && batch !== trainerFilter) return false;
      return true;
    });
  }, [events, trainerFilter, searchQuery]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps;
    const schedule = schedules.find((s) => s["Task ID"] === props.taskId);
    if (schedule) {
      setSelectedEvent(schedule);
      setDrawerOpen(true);
    }
  }, [schedules]);

  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const taskId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    if (!newStart) return;

    const newDateStr = formatToISTDate(newStart);
    const newTimeStr = formatToISTTime(newStart);

    try {
      await modifySheetData("update", "DailySchedules", {
        "Task ID": taskId,
        "Schedule Date": newDateStr,
        "Start Time": newTimeStr,
        "End Time": dropInfo.event.end ? formatToISTTime(dropInfo.event.end) : "",
        "Last Updated Timestamp (IST)": new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });
      toast.success("Schedule updated");

      const updated = await fetchSheetData<DailySchedule>("DailySchedules");
      setSchedules(updated);
    } catch {
      toast.error("Failed to update schedule");
      dropInfo.revert();
    }
  }, []);

  const handleEventResize = useCallback(async (resizeInfo: EventResizeDoneArg) => {
    const taskId = resizeInfo.event.id;
    const newEnd = resizeInfo.event.end;
    if (!newEnd) return;

    try {
      await modifySheetData("update", "DailySchedules", {
        "Task ID": taskId,
        "End Time": formatToISTTime(newEnd),
        "Last Updated Timestamp (IST)": new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      });
      toast.success("Schedule duration updated");

      const updated = await fetchSheetData<DailySchedule>("DailySchedules");
      setSchedules(updated);
    } catch {
      toast.error("Failed to update duration");
      resizeInfo.revert();
    }
  }, []);

  const handleDateSelect = useCallback((selectInfo: any) => {
    // Future: open a create schedule dialog
  }, []);

  const handleViewChange = useCallback((viewName: string) => {
    setView(viewName);
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(viewName);
  }, []);

  const navigateToday = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.today();
  }, []);

  const navigatePrev = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.prev();
  }, []);

  const navigateNext = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.next();
  }, []);

  const uniqueTrainers = useMemo(() => {
    return Array.from(new Set(trainers.map((t) => t.Name).filter(Boolean)));
  }, [trainers]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent-base" />
          <p className="text-sm text-muted-foreground">Loading calendar data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Enterprise scheduling and operational timeline view.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-card p-3">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 border-white/[0.08] text-xs" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden sm:block text-xs font-medium text-foreground/60 px-1">
          {/* Title is rendered by FullCalendar itself */}
        </div>

        {/* View switcher */}
        <div className="flex rounded-lg border border-white/[0.06] p-0.5">
          {[
            { id: "dayGridMonth", label: "Month" },
            { id: "timeGridWeek", label: "Week" },
            { id: "timeGridDay", label: "Day" },
            { id: "listWeek", label: "Agenda" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => handleViewChange(v.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                view === v.id
                  ? "bg-accent-soft text-accent-base"
                  : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-full max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-white/[0.08] bg-white/[0.04] pl-8 text-xs"
          />
        </div>

        {/* Trainer filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground/60" />
          <select
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
            className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-xs text-foreground outline-none focus:border-accent-base/50"
          >
            <option value="all">All Batches</option>
            {batchNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-premium rounded-xl border border-white/[0.06] bg-card overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={false}
          initialView={view}
          events={filteredEvents as any}
          editable={true}
          selectable={true}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          select={handleDateSelect}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator={true}
          timeZone="Asia/Kolkata"
          locale="en"
          firstDay={1}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZoneName: "short",
          }}
          dayHeaderFormat={{
            weekday: "short",
            month: "numeric",
            day: "numeric",
            omitCommas: true,
          }}
          eventContent={(arg) => {
            const props = arg.event.extendedProps;
            const status = props.status || "Scheduled";
            const isRunning = status === "Running";
            return (
              <div className="fc-event-inner h-full w-full overflow-hidden px-1.5 py-0.5 text-[10px] leading-tight">
                {isRunning && (
                  <span className="mr-1 inline-flex items-center gap-0.5 text-[8px] font-semibold text-green-300">
                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400" />
                    LIVE
                  </span>
                )}
                <div className="truncate font-medium">{arg.event.title}</div>
                <div className="flex items-center gap-1 opacity-80">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">
                    {formatEventTime(arg.event.startStr, arg.event.endStr)}
                  </span>
                </div>
                {!arg.view.type.startsWith("list") && (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 rounded-sm px-1 py-0 text-[7px] font-medium uppercase"
                    style={{ backgroundColor: statusColors[status] + "30", color: statusColors[status] }}
                  >
                    {status}
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.06] bg-card px-4 py-3">
        <span className="text-[11px] font-medium text-muted-foreground/60">Status Legend:</span>
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-muted-foreground/70">{status}</span>
          </div>
        ))}
        {batchNames.slice(0, 6).map((name, i) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getBatchColor(name, i) }} />
            <span className="text-[10px] text-muted-foreground/70 truncate max-w-[100px]">{name}</span>
          </div>
        ))}
      </div>

      {/* Event Detail Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/[0.06] bg-[#0A0A0F] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]"
                    style={{ backgroundColor: getBatchColor(selectedEvent["Batch Name"], batchNames.indexOf(selectedEvent["Batch Name"])) + "20" }}
                  >
                    <Calendar className="h-5 w-5" style={{ color: getBatchColor(selectedEvent["Batch Name"], batchNames.indexOf(selectedEvent["Batch Name"])) }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">{selectedEvent["Batch Name"]}</h2>
                    <p className="text-xs text-muted-foreground/60">Task: {selectedEvent["Task ID"]}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawerOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: statusColors[selectedEvent.Status || "Scheduled"] + "20",
                      color: statusColors[selectedEvent.Status || "Scheduled"],
                    }}
                  >
                    {getStatusIcon(selectedEvent.Status || "Scheduled")}
                    {selectedEvent.Status || "Scheduled"}
                  </span>
                  {selectedEvent.Status === "Running" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                      <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                      Live Now
                    </span>
                  )}
                </div>

                {/* Overview */}
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">Overview</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Date", value: selectedEvent["Schedule Date"] ? parseFormattedDate(selectedEvent["Schedule Date"]) || selectedEvent["Schedule Date"] : "—", icon: Calendar },
                      { label: "Start Time", value: selectedEvent["Start Time"] || "—", icon: Clock },
                      { label: "End Time", value: selectedEvent["End Time"] || "—", icon: Timer },
                      { label: "Duration", value: selectedEvent.Duration || calculateDuration(selectedEvent["Start Time"] || "", selectedEvent["End Time"] || "") || "—", icon: Timer },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                          <Icon className="h-3 w-3" />
                          {label}
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedEvent.Notes && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">Notes</h3>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                      <p className="text-sm text-foreground/80">{selectedEvent.Notes}</p>
                    </div>
                  </div>
                )}

                {/* Update History */}
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">History</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Last Updated", value: selectedEvent["Last Updated Timestamp (IST)"] || "—" },
                      { label: "Created", value: selectedEvent["Created Time (IST)"] || "—" },
                      { label: "Last Status Change", value: selectedEvent["Last Status Change Time (IST)"] || "—" },
                    ].filter((h) => h.value !== "—" && h.value).map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                        <span className="text-xs text-muted-foreground/60">{label}</span>
                        <span className="text-xs text-foreground/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
