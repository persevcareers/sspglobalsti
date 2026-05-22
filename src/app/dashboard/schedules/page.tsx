"use client";

import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import type { DailySchedule } from "@/types";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Play,
  Ban,
  Sun,
  BookOpen,
  Timer,
  RotateCcw,
  ArrowUpRight,
  Zap,
  User,
  Hash,
  ChevronRight,
  FileText,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { modifySheetData, callSessionAction } from "@/services/api";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { toast } from "sonner";
import {
  formatRawDateToISTDate,
  formatRawTimeToISTTime,
  parseToISTDateObject,
  determineAutoStatus,
  formatToISTDateTime,
} from "@/utils/dateUtils";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, statCardVariants, tableRowVariants } from "@/lib/animations";
import { INPUT_CLASS } from "@/constants/styles";
const STATUSES = ["Scheduled", "Running", "Completed", "Cancelled", "Holiday", "Postponed", "PAP"] as const;

const GRADIENT_CARDS = [
  { from: "from-accent-base/10", via: "via-accent-base/5", border: "hover:border-accent-base/20" },
  { from: "from-emerald-500/10", via: "via-teal-500/5", border: "hover:border-emerald-500/20" },
  { from: "from-teal-500/10", via: "via-cyan-500/5", border: "hover:border-teal-500/20" },
  { from: "from-rose-500/10", via: "via-orange-500/5", border: "hover:border-rose-500/20" },
];

const STATUS_STYLES: Record<string, { bg: string; dot: string; icon: React.ElementType }> = {
  Scheduled: { bg: "bg-accent-soft text-accent-base border-accent-base/20", dot: "bg-accent-base", icon: Calendar },
  Running: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", icon: Activity },
  Completed: { bg: "bg-teal-500/10 text-teal-400 border-teal-500/20", dot: "bg-teal-500", icon: CheckCircle2 },
  Cancelled: { bg: "bg-rose-500/10 text-rose-400 border-rose-500/20", dot: "bg-rose-500", icon: Ban },
  Holiday: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-500", icon: Sun },
  Postponed: { bg: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-500", icon: RotateCcw },
  PAP: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-500", icon: Clock },
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] || STATUS_STYLES.Scheduled;
}

function generateUniqueId() {
  return "TSK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Parse "DD - Day - Month Name - YYYY" into clean display
function parseScheduledDate(dateStr: string): { day: string; monthYear: string; weekday: string } | null {
  if (!dateStr || !dateStr.includes(" - ")) return null;
  const parts = dateStr.split(" - ").map((s) => s.trim());
  if (parts.length < 4) return null;
  return {
    day: parts[0],
    weekday: parts[1],
    monthYear: `${parts[2]} ${parts[3]}`,
  };
}

function formatSmartDate(dateStr: string, timeStr: string): { label: string; full: string; isToday: boolean; isTomorrow: boolean } {
  const parsed = parseScheduledDate(dateStr);
  if (!parsed) return { label: dateStr, full: dateStr, isToday: false, isTomorrow: false };

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { day: "2-digit", weekday: "long", month: "long", year: "numeric" });
  const todayFormatted = `${now.getDate().toString().padStart(2, "0")} - ${now.toLocaleDateString("en-US", { weekday: "long" })} - ${now.toLocaleDateString("en-US", { month: "long" })} - ${now.getFullYear()}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = `${tomorrow.getDate().toString().padStart(2, "0")} - ${tomorrow.toLocaleDateString("en-US", { weekday: "long" })} - ${tomorrow.toLocaleDateString("en-US", { month: "long" })} - ${tomorrow.getFullYear()}`;

  const displayTime = timeStr || "";
  const isToday = dateStr === todayFormatted;
  const isTomorrow = dateStr === tomorrowFormatted;

  let label: string;
  if (isToday) {
    label = `Today • ${displayTime}`;
  } else if (isTomorrow) {
    label = `Tomorrow • ${displayTime}`;
  } else {
    label = `${parsed.day} ${parsed.monthYear}`;
  }

  return { label, full: `${parsed.day} ${parsed.monthYear}, ${parsed.weekday}`, isToday, isTomorrow };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── BULK SCHEDULE FORM ───────────────────────────────────────
function BulkScheduleForm({
  onSave,
  isSubmitting,
}: {
  onSave: (data: { batchNames: string; date: string; startTime: string; notes: string }) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [batchNames, setBatchNames] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNames.trim() || !date || !startTime) {
      toast.error("Batch names, Date, and Start Time are required.");
      return;
    }
    await onSave({ batchNames, date, startTime, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bulk-batches">Batch Names (one per line or comma-separated)</Label>
        <Textarea id="bulk-batches" value={batchNames} onChange={(e) => setBatchNames(e.target.value)} placeholder="e.g.&#10;Python Batch A&#10;Python Batch B" rows={4} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bulk-date">Schedule Date</Label>
          <Input id="bulk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk-start">Start Time</Label>
          <Input id="bulk-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bulk-notes">Notes</Label>
        <Textarea id="bulk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional instructions..." rows={2} />
      </div>
      <Button type="submit" className="w-full gap-1.5" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : <><Layers className="h-4 w-4" /> Create Bulk Schedules</>}
      </Button>
    </form>
  );
}

// ─── PREMIUM STAT BADGE ──────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status);
  const isRunning = status === "Running";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all",
      style.bg,
      isRunning && "shadow-[0_0_12px_-2px_rgba(52,211,153,0.3)]"
    )}>
      {isRunning && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      )}
      {!isRunning && <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />}
      {status}
    </span>
  );
}

// ─── DETAIL DRAWER ───────────────────────────────────────────
function ScheduleDetailDrawer({
  schedule,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  schedule: DailySchedule | null;
  open: boolean;
  onClose: () => void;
  onEdit: (s: DailySchedule) => void;
  onDelete: (s: DailySchedule) => void;
}) {
  if (!schedule) return null;
  const parsed = parseScheduledDate(schedule["Schedule Date"]);
  const dateDisplay = parsed ? `${parsed.day} ${parsed.monthYear}, ${parsed.weekday}` : schedule["Schedule Date"];
  const style = getStatusStyle(schedule.Status);
  const Icon = style.icon;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full border-border bg-popover/95 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="pb-0">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border", style.bg.replace("text-", "").replace("border-", ""))}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{schedule["Batch Name"]}</SheetTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={schedule.Status} />
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/50">
                  <Hash className="h-3 w-3" />
                  {schedule["Task ID"]}
                </span>
              </div>
            </div>
          </div>
          <SheetDescription className="mt-3 text-sm text-muted-foreground/70 line-clamp-2">{schedule.Notes || "No notes available."}</SheetDescription>
        </SheetHeader>
        <Separator className="my-4 bg-border" />

        <div className="space-y-5 px-4 pb-8 overflow-y-auto scrollbar-thin">
          {/* Overview grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: "Date", value: dateDisplay },
              { icon: Clock, label: "Start Time", value: schedule["Start Time"] || "—" },
              { icon: Clock, label: "End Time", value: schedule["End Time"] || "—" },
              { icon: Timer, label: "Duration", value: schedule["Duration"] || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-card-hover-bg p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
              <Activity className="h-3 w-3" />
              Timeline
            </h4>
            <div className="space-y-1">
              {[
                { label: "Created", value: schedule["Created Time (IST)"] },
                { label: "Last Modified", value: schedule["Modified Time (IST)"] },
                { label: "Status Change", value: schedule["Last Status Change Time (IST)"] },
                { label: "Last Updated", value: schedule["Last Updated Timestamp (IST)"] },
              ].filter((t) => t.value).map(({ label, value }, i) => (
                <div key={label} className={cn(
                  "relative flex items-center justify-between rounded-lg border border-border bg-card-hover-bg px-3.5 py-2.5",
                  i > 0 && "border-t-0 rounded-t-none"
                )}>
                  <span className="text-xs text-muted-foreground/60">{label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
              <FileText className="h-3 w-3" />
              Session Notes
            </h4>
            <div className="rounded-xl border border-border bg-card-hover-bg p-3.5">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{schedule.Notes || "No notes for this session."}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-border" onClick={() => { onEdit(schedule); onClose(); }}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 border-border text-rose-400 hover:text-rose-300" onClick={() => { onDelete(schedule); onClose(); }}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── TIMELINE SECTION HEADER ────────────────────────────────
function TimelineGroup({ label, count, icon: Icon, color }: { label: string; count: number; icon: React.ElementType; color: string }) {
  if (count === 0) return null;
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className={cn("h-3.5 w-3.5", color)} />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</span>
      <span className="text-[10px] text-muted-foreground/30">({count})</span>
      <Separator className="flex-1 bg-border/50" />
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────
export default function SchedulesPage() {
  const { data: schedules, isLoading, error, createRecord, updateRecord, deleteRecord, refresh } = useSheetsData<DailySchedule>("DailySchedules");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DailySchedule | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DailySchedule | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q || s["Batch Name"]?.toLowerCase().includes(q) || s["Task ID"]?.toLowerCase().includes(q) || s.Notes?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.Status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schedules, debouncedSearch, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ta = parseToISTDateObject(a["Schedule Date"] || "", a["Start Time"] || "") || new Date(0);
      const tb = parseToISTDateObject(b["Schedule Date"] || "", b["Start Time"] || "") || new Date(0);
      const diff = ta.getTime() - tb.getTime();
      return diff !== 0 ? diff : (a["Batch Name"] || "").localeCompare(b["Batch Name"] || "");
    });
  }, [filtered]);

  // Timeline grouping
  const grouped = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getDate().toString().padStart(2, "0")} - ${now.toLocaleDateString("en-US", { weekday: "long" })} - ${now.toLocaleDateString("en-US", { month: "long" })} - ${now.getFullYear()}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getDate().toString().padStart(2, "0")} - ${tomorrow.toLocaleDateString("en-US", { weekday: "long" })} - ${tomorrow.toLocaleDateString("en-US", { month: "long" })} - ${tomorrow.getFullYear()}`;

    const today: DailySchedule[] = [];
    const tomorrowS: DailySchedule[] = [];
    const upcoming: DailySchedule[] = [];
    const past: DailySchedule[] = [];

    for (const s of sorted) {
      const d = s["Schedule Date"];
      if (d === todayStr) today.push(s);
      else if (d === tomorrowStr) tomorrowS.push(s);
      else {
        const dt = parseToISTDateObject(d, s["Start Time"] || "00:00");
        if (dt && dt.getTime() < now.getTime()) past.push(s);
        else upcoming.push(s);
      }
    }

    return { today, tomorrow: tomorrowS, upcoming, past };
  }, [sorted]);

  const stats = useMemo(() => {
    const total = schedules.length;
    const running = schedules.filter((s) => s.Status === "Running").length;
    const completed = schedules.filter((s) => s.Status === "Completed").length;
    const exceptions = schedules.filter((s) => ["Cancelled", "Holiday", "Postponed"].includes(s.Status)).length;
    const todayCount = grouped.today.length;
    return { total, running, completed, exceptions, todayCount };
  }, [schedules, grouped]);

  const handleSave = useCallback(async (data: Partial<DailySchedule>) => {
    const ok = editingSchedule ? await updateRecord({ ...data, "Task ID": editingSchedule["Task ID"] }) : await createRecord({ ...data, "Task ID": generateUniqueId() });
    if (ok) { setIsDialogOpen(false); setEditingSchedule(null); }
  }, [editingSchedule, updateRecord, createRecord]);

  const handleBulkSave = useCallback(async (data: { batchNames: string; date: string; startTime: string; notes: string }) => {
    setIsBulkSubmitting(true);
    const batchList = data.batchNames.split(/[\n,]+/).map((b) => b.trim()).filter(Boolean);
    if (batchList.length === 0) { toast.error("Please enter at least one batch name."); setIsBulkSubmitting(false); return; }
    try {
      const formattedDateVal = formatRawDateToISTDate(data.date);
      const formattedStartVal = formatRawTimeToISTTime(data.startTime);
      const nowIST = formatToISTDateTime(new Date());
      const autoStatusVal = determineAutoStatus(formattedDateVal, formattedStartVal, "", "Scheduled");
      for (const batchName of batchList) {
        await modifySheetData("create", "DailySchedules", {
          "Task ID": generateUniqueId(), "Batch Name": batchName, "Schedule Date": formattedDateVal,
          "Start Time": formattedStartVal, "End Time": "", Status: autoStatusVal, Duration: "",
          Notes: data.notes || "", "Last Updated Timestamp (IST)": nowIST, "Created Time (IST)": nowIST,
          "Modified Time (IST)": nowIST, "Last Status Change Time (IST)": nowIST,
        } as DailySchedule);
      }
      toast.success(`Created ${batchList.length} schedules.`);
      try { await callSessionAction("createNotification", { userId: "", title: "Schedules Created", message: `${batchList.length} schedule(s) created in bulk`, category: "schedule", priority: "medium", sourceModule: "schedules", actionUrl: "/dashboard/schedules" }); } catch { /* ignore */ }
      setIsBulkDialogOpen(false); await refresh();
    } catch { toast.error("Error creating bulk schedules."); } finally { setIsBulkSubmitting(false); }
  }, [refresh]);

  const handleEdit = useCallback((s: DailySchedule) => { setEditingSchedule(s); setIsDialogOpen(true); }, []);
  const handleDelete = useCallback(async (s: DailySchedule) => {
    if (confirm(`Delete schedule for "${s["Batch Name"]}"?`)) await deleteRecord({ "Task ID": s["Task ID"] });
  }, [deleteRecord]);
  const handleView = useCallback((s: DailySchedule) => { setSelectedSchedule(s); setDrawerOpen(true); }, []);

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
      {/* Stats Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Layers, label: "Total Sessions", value: stats.total, desc: "All schedule entries", trend: `${stats.todayCount} today`, trendUp: true },
          { icon: Activity, label: "Live Now", value: stats.running, desc: "Currently running sessions", trend: stats.running > 0 ? "Active" : "Idle", trendUp: stats.running > 0 },
          { icon: CheckCircle2, label: "Completed", value: stats.completed, desc: "Finished sessions", trend: `${Math.round((schedules.length > 0 ? stats.completed / schedules.length : 0) * 100)}% rate`, trendUp: true },
          { icon: AlertTriangle, label: "Exceptions", value: stats.exceptions, desc: "Cancelled / Holiday / Postponed", trend: `${stats.exceptions} issues`, trendUp: false },
        ].map(({ icon: Icon, label, value, desc, trend, trendUp }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className={cn(
              "relative overflow-hidden border-border bg-card shadow-none transition-all duration-300 hover:scale-[1.02]",
              GRADIENT_CARDS[i].border
            )}>
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", GRADIENT_CARDS[i].from, GRADIENT_CARDS[i].via)} />
              <CardContent className="relative flex items-start gap-4 p-4">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border",
                  i === 1 && stats.running > 0 ? "bg-emerald-500/10" : "bg-card-hover-bg"
                )}>
                  <Icon className={cn("h-4.5 w-4.5", i === 1 && stats.running > 0 ? "text-emerald-400" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                    {trend && (
                      <span className={cn("flex shrink-0 items-center gap-0.5 text-[10px] font-medium", trendUp ? "text-emerald-400" : "text-rose-400")}>
                        <ArrowUpRight className={cn("h-3 w-3", !trendUp && "rotate-90")} />
                        {trend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60">{label}</p>
                  <p className="text-[10px] text-muted-foreground/40 truncate">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Schedules</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage training sessions, time blocks, and live operations.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-border bg-card-hover-bg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={cn("rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all", viewMode === "table" ? "bg-accent-soft text-accent-base shadow-sm" : "text-muted-foreground/50 hover:text-muted-foreground")}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={cn("rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all", viewMode === "timeline" ? "bg-accent-soft text-accent-base shadow-sm" : "text-muted-foreground/50 hover:text-muted-foreground")}
            >
              Timeline
            </button>
          </div>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border text-xs" onClick={() => setIsBulkDialogOpen(true)}>
              <Layers className="h-3.5 w-3.5" /> Bulk
            </Button>
            <DialogContent className="border-border bg-popover/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Bulk Create Schedules</DialogTitle><DialogDescription>Create multiple batches at once with a shared date and time.</DialogDescription></DialogHeader>
              <BulkScheduleForm onSave={handleBulkSave} isSubmitting={isBulkSubmitting} />
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditingSchedule(null); }}>
            <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Schedule
            </Button>
            <DialogContent className="border-border bg-popover/95 backdrop-blur-xl sm:max-w-[600px]">
              <DialogHeader><DialogTitle>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</DialogTitle></DialogHeader>
              <ScheduleForm initialData={editingSchedule} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-[700px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            placeholder="Search by batch name, task ID, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(INPUT_CLASS, "w-full pl-9")}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
              statusFilter === "all" ? "bg-accent-soft text-accent-base shadow-sm" : "text-muted-foreground/50 hover:bg-card-hover-bg hover:text-muted-foreground"
            )}
          >
            All
          </button>
          {STATUSES.map((s) => {
            const style = getStatusStyle(s);
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200",
                  statusFilter === s
                    ? cn(style.bg, "shadow-sm")
                    : "text-muted-foreground/50 hover:bg-card-hover-bg hover:text-muted-foreground"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-4"><TableSkeleton rows={6} /></div>
      ) : error ? (
        <ErrorState title="Failed to load schedules" message={error} onRetry={refresh} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No schedules match your filters" : "No schedules yet"}
          description={searchTerm || statusFilter !== "all" ? "Try adjusting your search or filter criteria." : "Create your first schedule to start tracking training sessions."}
          icon={Calendar}
          action={!searchTerm && statusFilter === "all" ? (
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Your First Schedule
            </Button>
          ) : undefined}
        />
      ) : viewMode === "timeline" ? (
        /* ─── TIMELINE VIEW ───────────────────────────── */
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {[
              { label: "Today", key: "today", data: grouped.today, icon: Zap, color: "text-emerald-400" },
              { label: "Tomorrow", key: "tomorrow", data: grouped.tomorrow, icon: Calendar, color: "text-blue-400" },
              { label: "Upcoming", key: "upcoming", data: grouped.upcoming, icon: Clock, color: "text-accent-base" },
              { label: "Past Sessions", key: "past", data: grouped.past, icon: RotateCcw, color: "text-muted-foreground/40" },
            ].filter((g) => g.data.length > 0).map((group) => (
              <motion.div key={group.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <TimelineGroup label={group.label} count={group.data.length} icon={group.icon} color={group.color} />
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.data.map((schedule, i) => {
                    const style = getStatusStyle(schedule.Status);
                    const Icon = style.icon;
                    const isRunning = schedule.Status === "Running";
                    const smart = formatSmartDate(schedule["Schedule Date"], schedule["Start Time"]);
                    return (
                      <motion.div
                        key={schedule["Task ID"] || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          "group cursor-pointer rounded-xl border bg-card p-4 transition-all duration-200 hover:scale-[1.01]",
                          isRunning ? "border-emerald-500/30 shadow-[0_0_20px_-6px_rgba(52,211,153,0.2)]" : "border-border hover:border-card-hover-bg hover:bg-card-raised"
                        )}
                        onClick={() => handleView(schedule)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View schedule for ${schedule["Batch Name"]}`}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(schedule); }}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", isRunning ? "border-emerald-500/20 bg-emerald-500/10" : "border-border bg-card-hover-bg")}>
                              {isRunning ? (
                                <span className="relative flex h-3 w-3">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                                </span>
                              ) : (
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{schedule["Batch Name"]}</p>
                              <p className="font-mono text-[10px] text-muted-foreground/40">{schedule["Task ID"]}</p>
                            </div>
                          </div>
                          <StatusBadge status={schedule.Status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {smart.full}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule["Start Time"]}
                            {schedule["End Time"] && <span className="text-muted-foreground/40">→ {schedule["End Time"]}</span>}
                          </span>
                          {schedule.Duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {schedule.Duration}
                            </span>
                          )}
                        </div>
                        {schedule.Notes && (
                          <p className="mt-2 text-xs text-muted-foreground/40 line-clamp-1">{schedule.Notes}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* ─── TABLE VIEW ──────────────────────────────── */
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    {["Session", "Date & Time", "Status", "Duration", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((schedule, i) => {
                    const isRunning = schedule.Status === "Running";
                    const style = getStatusStyle(schedule.Status);
                    const Icon = style.icon;
                    const smart = formatSmartDate(schedule["Schedule Date"], schedule["Start Time"]);
                    return (
                      <motion.tr
                        key={schedule["Task ID"] || i}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        className={cn(
                          "group cursor-pointer border-b border-border/40 transition-all duration-200",
                          isRunning ? "bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]" : "hover:bg-card-hover-bg"
                        )}
                        onClick={() => handleView(schedule)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View schedule for ${schedule["Batch Name"]}`}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(schedule); }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all",
                              isRunning ? "border-emerald-500/20 bg-emerald-500/10" : "border-border bg-card-hover-bg group-hover:bg-card-hover-bg"
                            )}>
                              {isRunning ? (
                                <span className="relative flex h-3 w-3">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                                </span>
                              ) : (
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">{schedule["Batch Name"]}</p>
                                {isRunning && (
                                  <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                                    Live
                                  </span>
                                )}
                              </div>
                              <p className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/40 mt-0.5">
                                <Hash className="h-2.5 w-2.5" />
                                {schedule["Task ID"]}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <p className={cn(
                              "text-sm",
                              smart.isToday ? "text-emerald-400 font-medium" : smart.isTomorrow ? "text-blue-400" : "text-foreground"
                            )}>
                              {smart.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50">{smart.full}</p>
                            {schedule["End Time"] && (
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
                                <Clock className="h-2.5 w-2.5" />
                                {schedule["Start Time"]} → {schedule["End Time"]}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={schedule.Status} /></td>
                        <td className="hidden px-4 py-4 sm:table-cell">
                          {schedule.Duration ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card-hover-bg px-2 py-1 text-[11px] font-medium text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              {schedule.Duration}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Schedule actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 border-border bg-popover/95 backdrop-blur-xl">
                              <DropdownMenuItem onClick={() => handleView(schedule)}>
                                <ExternalLink className="h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(schedule)}>
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {sorted.map((schedule, i) => {
              const isRunning = schedule.Status === "Running";
              const style = getStatusStyle(schedule.Status);
              const Icon = style.icon;
              const smart = formatSmartDate(schedule["Schedule Date"], schedule["Start Time"]);
              return (
                <motion.div
                  key={schedule["Task ID"] || i}
                  custom={i}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-all duration-200",
                    isRunning ? "border-emerald-500/30 bg-card shadow-[0_0_20px_-6px_rgba(52,211,153,0.15)]" : "border-border bg-card hover:bg-card-hover-bg"
                  )}
                  onClick={() => handleView(schedule)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(schedule); }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", isRunning ? "border-emerald-500/20 bg-emerald-500/10" : "border-border bg-card-hover-bg")}>
                        {isRunning ? (
                          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
                        ) : (
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{schedule["Batch Name"]}</p>
                        <p className="font-mono text-[10px] text-muted-foreground/40">{schedule["Task ID"]}</p>
                      </div>
                    </div>
                    <StatusBadge status={schedule.Status} />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/60">
                    <span className={cn("flex items-center gap-1", smart.isToday && "text-emerald-400")}>
                      <Calendar className="h-3 w-3" />
                      {smart.label}
                    </span>
                    {schedule.Duration && (
                      <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{schedule.Duration}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                    <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleEdit(schedule); }}><Pencil className="h-3 w-3" />Edit</Button>
                    <Button variant="ghost" size="xs" className="gap-1 text-rose-400" onClick={(e) => { e.stopPropagation(); handleDelete(schedule); }}><Trash2 className="h-3 w-3" />Delete</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail Drawer */}
      <ScheduleDetailDrawer
        schedule={selectedSchedule}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedSchedule(null); }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </motion.div>
  );
}
