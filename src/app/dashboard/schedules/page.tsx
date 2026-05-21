"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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
  History,
  Play,
  Square,
  Ban,
  Sun,
  CalendarClock,
  BookOpen,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const INPUT_CLASS = "h-9 border-white/[0.08] bg-white/[0.04] text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:border-indigo-500/50 focus-visible:ring-[3px] focus-visible:ring-indigo-500/20 transition-all duration-200";

const STATUS_STYLES: Record<string, string> = {
  Scheduled: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Running: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold",
  Completed: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Holiday: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Postponed: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  PAP: "bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold",
};

const STATUSES = ["Scheduled", "Running", "Completed", "Cancelled", "Holiday", "Postponed", "PAP"] as const;

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", STATUS_STYLES[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

function generateUniqueId() {
  return "TSK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

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
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Bulk Schedules"}</Button>
    </form>
  );
}

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
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]"><Calendar className="h-6 w-6 text-muted-foreground" /></div>
            <div>
              <SheetTitle className="text-xl">{schedule["Batch Name"]}</SheetTitle>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={schedule.Status} />
                <span className="text-xs text-muted-foreground">ID: {schedule["Task ID"]}</span>
              </div>
            </div>
          </div>
          <SheetDescription className="mt-3 text-sm text-muted-foreground/70">{schedule.Notes || "No notes"}</SheetDescription>
        </SheetHeader>
        <Separator className="my-4 bg-white/[0.06]" />
        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: "Date", value: schedule["Schedule Date"] },
              { icon: Clock, label: "Start Time", value: schedule["Start Time"] },
              { icon: Clock, label: "End Time", value: schedule["End Time"] || "—" },
              { icon: BookOpen, label: "Duration", value: schedule["Duration"] || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50"><Icon className="h-3 w-3" />{label}</div>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Notes</h4>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
              <p className="text-sm text-muted-foreground">{schedule.Notes || "No notes"}</p>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Timeline</h4>
            <div className="space-y-2">
              {[
                { label: "Created", value: schedule["Created Time (IST)"] },
                { label: "Last Modified", value: schedule["Modified Time (IST)"] },
                { label: "Status Change", value: schedule["Last Status Change Time (IST)"] },
                { label: "Last Updated", value: schedule["Last Updated Timestamp (IST)"] },
              ].filter((t) => t.value).map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                  <span className="text-xs text-muted-foreground/60">{label}</span>
                  <span className="text-xs text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { onEdit(schedule); onClose(); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-red-400 hover:text-red-300" onClick={() => { onDelete(schedule); onClose(); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function SchedulesPage() {
  const { data: schedules, isLoading, error, createRecord, updateRecord, deleteRecord, refresh } = useSheetsData<DailySchedule>("DailySchedules");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DailySchedule | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<DailySchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<DailySchedule | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || s["Batch Name"]?.toLowerCase().includes(q) || s["Task ID"]?.toLowerCase().includes(q) || s.Notes?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.Status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [schedules, searchTerm, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ta = parseToISTDateObject(a["Schedule Date"] || "", a["Start Time"] || "") || new Date(0);
      const tb = parseToISTDateObject(b["Schedule Date"] || "", b["Start Time"] || "") || new Date(0);
      const diff = ta.getTime() - tb.getTime();
      return diff !== 0 ? diff : (a["Batch Name"] || "").localeCompare(b["Batch Name"] || "");
    });
  }, [filtered]);

  const stats = useMemo(() => ({
    total: filtered.length,
    running: filtered.filter((s) => s.Status === "Running").length,
    completed: filtered.filter((s) => s.Status === "Completed").length,
    exceptions: filtered.filter((s) => ["Cancelled", "Holiday", "Postponed"].includes(s.Status)).length,
  }), [filtered]);

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
      try { await callSessionAction("createNotification", { "User ID": "", Title: "Schedules Created", Message: `${batchList.length} schedule(s) created in bulk`, Type: "success", Link: "/dashboard/schedules" }); } catch { /* ignore */ }
      setIsBulkDialogOpen(false); await refresh();
    } catch { toast.error("Error creating bulk schedules."); } finally { setIsBulkSubmitting(false); }
  }, [refresh]);

  const handleEdit = useCallback((s: DailySchedule) => { setEditingSchedule(s); setIsDialogOpen(true); }, []);
  const handleDelete = useCallback(async (s: DailySchedule) => {
    if (confirm(`Delete schedule for "${s["Batch Name"]}"?`)) await deleteRecord({ "Task ID": s["Task ID"] });
  }, [deleteRecord]);
  const handleView = useCallback((s: DailySchedule) => { setSelectedSchedule(s); setDrawerOpen(true); }, []);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Calendar, label: "Total Schedules", value: stats.total, desc: "All entries" },
          { icon: Activity, label: "Running", value: stats.running, desc: "In progress now" },
          { icon: CheckCircle2, label: "Completed", value: stats.completed, desc: "Finished" },
          { icon: AlertTriangle, label: "Exceptions", value: stats.exceptions, desc: "Cancelled/Holiday/Postponed" },
        ].map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className="border-white/[0.06] bg-card shadow-none transition-all duration-200 hover:border-white/[0.10]">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]"><Icon className="h-4.5 w-4.5 text-muted-foreground" /></div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground/60">{label}</p>
                  <p className="text-[10px] text-muted-foreground/40">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Schedules</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage training routines, time blocks, and batch statuses with IST synchronization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <Button variant="outline" size="sm" className="gap-1.5 border-white/[0.08]" onClick={() => setIsBulkDialogOpen(true)}><Layers className="h-3.5 w-3.5" /> Bulk Add</Button>
            <DialogContent className="border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader><DialogTitle>Bulk Create Schedules</DialogTitle><DialogDescription>Create multiple batches at once with a shared date and time.</DialogDescription></DialogHeader>
              <BulkScheduleForm onSave={handleBulkSave} isSubmitting={isBulkSubmitting} />
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditingSchedule(null); }}>
            <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Schedule</Button>
            <DialogContent className="border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-[600px]">
              <DialogHeader><DialogTitle>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</DialogTitle></DialogHeader>
              <ScheduleForm initialData={editingSchedule} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input placeholder="Search by batch, task ID, notes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={cn(INPUT_CLASS, "w-full pl-9")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStatusFilter("all")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === "all" ? "bg-indigo-500/10 text-indigo-400" : "text-muted-foreground/60 hover:bg-white/[0.04]")}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === s ? "bg-indigo-500/10 text-indigo-400" : "text-muted-foreground/60 hover:bg-white/[0.04]", s === "Running" ? "text-emerald-400" : s === "Completed" ? "text-teal-400" : "")}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/[0.06] bg-card p-4"><TableSkeleton rows={6} /></div>
      ) : error ? (
        <ErrorState title="Failed to load schedules" message={error} onRetry={refresh} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No schedules match your filters" : "No schedules yet"}
          description="Create your first schedule to start tracking batches."
          icon={Calendar}
          action={!searchTerm && statusFilter === "all" ? <Button onClick={() => setIsDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Your First Schedule</Button> : undefined}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/[0.06] bg-card md:block">
            <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Batch", "Schedule", "Status", "Duration", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((schedule, i) => (
                    <motion.tr key={schedule["Task ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                      className="group cursor-pointer border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.03]"
                      onClick={() => handleView(schedule)} tabIndex={0} role="button" aria-label={`View schedule for ${schedule["Batch Name"]}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(schedule); }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] transition-all group-hover:bg-white/[0.08]"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /></div>
                          <div>
                            <p className="font-medium text-foreground">{schedule["Batch Name"]}</p>
                            <p className="font-mono text-[10px] text-muted-foreground/40">{schedule["Task ID"]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm text-foreground">{schedule["Schedule Date"]}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <Clock className="h-3 w-3" />
                            {schedule["Start Time"]}
                            {schedule["End Time"] && <span className="text-muted-foreground/40">→ {schedule["End Time"]}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={schedule.Status} /></td>
                      <td className="hidden px-4 py-4 sm:table-cell text-sm text-muted-foreground">{schedule.Duration || "—"}</td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Schedule actions"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => handleEdit(schedule)}><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleView(schedule)}><ExternalLink className="h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(schedule)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {sorted.map((schedule, i) => (
              <motion.div key={schedule["Task ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                className="cursor-pointer rounded-xl border border-white/[0.06] bg-card p-4 transition-all duration-200 hover:bg-white/[0.03]"
                onClick={() => handleView(schedule)} tabIndex={0} role="button"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(schedule); }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div><p className="font-medium text-foreground">{schedule["Batch Name"]}</p><p className="text-xs text-muted-foreground/60">{schedule["Task ID"]}</p></div>
                  <StatusBadge status={schedule.Status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{schedule["Schedule Date"]}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{schedule["Start Time"]}{schedule["End Time"] ? ` → ${schedule["End Time"]}` : ""}</span>
                  {schedule.Duration && <span>{schedule.Duration}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.04] pt-3">
                  <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleEdit(schedule); }}><Pencil className="h-3 w-3" />Edit</Button>
                  <Button variant="ghost" size="xs" className="gap-1 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(schedule); }}><Trash2 className="h-3 w-3" />Delete</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <ScheduleDetailDrawer schedule={selectedSchedule} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedSchedule(null); }} onEdit={handleEdit} onDelete={handleDelete} />
    </motion.div>
  );
}
