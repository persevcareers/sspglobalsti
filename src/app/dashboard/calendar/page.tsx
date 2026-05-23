"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useSheetsData } from "@/hooks/useSheetsData";
import { DailySchedule } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { fadeIn } from "@/lib/animations";
import { parseToISTDateObject, parseFormattedDate, parseFormattedTime, calculateDuration, formatToISTTime } from "@/utils/dateUtils";
import { modifySheetData, callSessionAction } from "@/services/api";
import { Search, ChevronLeft, ChevronRight, Dot, Clock, CalendarDays, History, FileText } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

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
  Completed: "fc-event-completed",
  Cancelled: "fc-event-cancelled",
  Holiday: "fc-event-holiday",
  Postponed: "fc-event-postponed",
  PAP: "fc-event-pap",
};

function scheduleToEvent(s: DailySchedule): {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  classNames: string[];
  extendedProps: Record<string, unknown>;
} {
  const startDate = parseToISTDateObject(s["Schedule Date"] || "", s["Start Time"] || "");
  const endDate = s["End Time"]
    ? parseToISTDateObject(s["Schedule Date"] || "", s["End Time"] || "")
    : startDate ? new Date(startDate.getTime() + 3600000) : new Date();

  const color = getBatchColor(s["Batch Name"] || "");

  return {
    id: s["Task ID"] || "",
    title: s["Batch Name"] || "Untitled",
    start: startDate?.toISOString() || new Date().toISOString(),
    end: endDate?.toISOString() || new Date().toISOString(),
    backgroundColor: color + "22",
    borderColor: color,
    classNames: [STATUS_CLASSES[s.Status] || "", "fc-event-custom"],
    extendedProps: { ...s },
  };
}

export default function CalendarPage() {
  const { data: schedules, isLoading, refresh } = useSheetsData<DailySchedule>("DailySchedules");
  const calendarRef = useRef<FullCalendar>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [viewTitle, setViewTitle] = useState("");
  const [detailSchedule, setDetailSchedule] = useState<DailySchedule | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const batchNames = useMemo(() => {
    const names = new Set(schedules.map((s) => s["Batch Name"]).filter(Boolean));
    return Array.from(names).sort();
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const term = debouncedSearch.toLowerCase();
      if (term && !s["Batch Name"]?.toLowerCase().includes(term) && !s["Notes"]?.toLowerCase().includes(term)) return false;
      if (batchFilter !== "all" && s["Batch Name"] !== batchFilter) return false;
      return true;
    });
  }, [schedules, debouncedSearch, batchFilter]);

  const events = useMemo(() => filteredSchedules.map(scheduleToEvent), [filteredSchedules]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const view = arg.view;
    setViewTitle(view.title);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const props = arg.event.extendedProps as unknown as DailySchedule;
    setDetailSchedule(props);
    setIsDetailOpen(true);
  }, []);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const props = arg.event.extendedProps as unknown as DailySchedule;
    const newStart = arg.event.start;
    const newEnd = arg.event.end;

    if (!newStart) return;

    const year = newStart.getFullYear();
    const month = String(newStart.getMonth() + 1).padStart(2, "0");
    const day = String(newStart.getDate()).padStart(2, "0");
    const newDateStr = `${year}-${month}-${day}`;

    const startHr = String(newStart.getHours()).padStart(2, "0");
    const startMin = String(newStart.getMinutes()).padStart(2, "0");
    const newStartTime = `${startHr}:${startMin}`;

    let newEndTime = props["End Time"] || "";
    if (newEnd) {
      const endHr = String(newEnd.getHours()).padStart(2, "0");
      const endMin = String(newEnd.getMinutes()).padStart(2, "0");
      newEndTime = `${endHr}:${endMin}`;
    }

    try {
      const result = await modifySheetData("update", "DailySchedules", {
        "Task ID": props["Task ID"],
        "Schedule Date": newDateStr,
        "Start Time": newStartTime,
        "End Time": newEndTime,
      });
      if (result.success) {
        toast.success("Schedule updated");
        refresh();
      } else {
        arg.revert();
        toast.error("Failed to update schedule");
      }
    } catch {
      arg.revert();
      toast.error("Network error updating schedule");
    }
  }, [refresh]);

  const handleEventResize = useCallback(async (arg: EventResizeDoneArg) => {
    const props = arg.event.extendedProps as unknown as DailySchedule;
    const newEnd = arg.event.end;
    if (!newEnd) return;

    const endHr = String(newEnd.getHours()).padStart(2, "0");
    const endMin = String(newEnd.getMinutes()).padStart(2, "0");
    const newEndTime = `${endHr}:${endMin}`;

    try {
      const result = await modifySheetData("update", "DailySchedules", {
        "Task ID": props["Task ID"],
        "End Time": newEndTime,
      });
      if (result.success) {
        toast.success("Duration updated");
        refresh();
      } else {
        arg.revert();
        toast.error("Failed to update duration");
      }
    } catch {
      arg.revert();
      toast.error("Network error");
    }
  }, [refresh]);

  const handleViewChange = (view: string) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(view);
    }
  };

  const navigate = (dir: "prev" | "next" | "today") => {
    const api = calendarRef.current?.getApi();
    if (api) {
      if (dir === "prev") api.prev();
      else if (dir === "next") api.next();
      else api.today();
    }
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("today")}>Today</Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("next")}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search batches or notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 pl-8" />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batchNames.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center rounded-lg border bg-card p-0.5 ml-auto">
          {[
            { value: "dayGridMonth", label: "Month" },
            { value: "timeGridWeek", label: "Week" },
            { value: "timeGridDay", label: "Day" },
            { value: "listWeek", label: "Agenda" },
          ].map((v) => (
            <button key={v.value} onClick={() => handleViewChange(v.value)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors data-[active=true]:bg-accent-soft data-[active=true]:text-accent-base"
            >{v.label}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden calendar-premium">
        {!isLoading && (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={events}
            editable={true}
            eventDurationEditable={true}
            eventStartEditable={true}
            nowIndicator={true}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
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

      <div className="flex flex-wrap items-center gap-3 px-1 py-2 text-xs text-muted-foreground">
        <span className="font-medium">Status:</span>
        {["Scheduled", "Running", "Completed", "Cancelled", "Holiday", "Postponed", "PAP"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", {
              "bg-indigo-500": s === "Scheduled",
              "bg-emerald-500": s === "Running",
              "bg-teal-500": s === "Completed",
              "bg-rose-500": s === "Cancelled",
              "bg-amber-500": s === "Holiday",
              "bg-orange-500": s === "Postponed",
              "bg-blue-500": s === "PAP",
            })} />
            {s}
          </span>
        ))}
        <span className="mx-1 text-border">|</span>
        {batchNames.slice(0, 8).map((name) => (
          <span key={name} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getBatchColor(name) }} />
            {name}
          </span>
        ))}
        {batchNames.length > 8 && <span>+{batchNames.length - 8} more</span>}
      </div>

      <Sheet open={isDetailOpen} onOpenChange={(o) => { if (!o) { setIsDetailOpen(false); setDetailSchedule(null); } }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{detailSchedule?.["Batch Name"] || "Event Details"}</SheetTitle>
            <SheetDescription>Task ID: {detailSchedule?.["Task ID"]}</SheetDescription>
          </SheetHeader>
          {detailSchedule && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", {
                  "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300": detailSchedule.Status === "Scheduled",
                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 animate-pulse": detailSchedule.Status === "Running",
                  "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300": detailSchedule.Status === "Completed",
                  "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300": detailSchedule.Status === "Cancelled",
                  "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300": detailSchedule.Status === "Holiday",
                  "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300": detailSchedule.Status === "Postponed",
                  "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300": detailSchedule.Status === "PAP",
                })}>
                  {detailSchedule.Status}
                </span>
                {detailSchedule.Status === "Running" && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />LIVE</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-semibold mt-1">{detailSchedule["Schedule Date"]}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Start Time</p><p className="text-sm font-semibold mt-1">{detailSchedule["Start Time"]}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">End Time</p><p className="text-sm font-semibold mt-1">{detailSchedule["End Time"] || "—"}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Duration</p><p className="text-sm font-semibold mt-1">{detailSchedule.Duration || calculateDuration(detailSchedule["Start Time"], detailSchedule["End Time"]) || "—"}</p></div>
              </div>

              {detailSchedule.Notes && (
                <div><h4 className="text-sm font-semibold mb-2">Notes</h4><p className="text-sm text-muted-foreground">{detailSchedule.Notes}</p></div>
              )}

              <div><h4 className="text-sm font-semibold mb-2">Update History</h4>
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
