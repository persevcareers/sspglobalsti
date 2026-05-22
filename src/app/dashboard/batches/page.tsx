"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Batch } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BatchForm } from "@/components/forms/BatchForm";
import { DataTable, Column } from "@/components/tables/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { fadeIn, statCardVariants, staggerContainer } from "@/lib/animations";
import {
  Plus,
  Download,
  PlayCircle,
  Clock,
  CheckCircle2,
  Layers,
  Pencil,
  Trash2,
  AlertTriangle,
  MoreHorizontal,
  BookOpen,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getStatusColor } from "@/lib/utils";

const STATUS_BG: Record<string, string> = {
  Ongoing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Upcoming: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_BG[status] || "bg-muted text-muted-foreground")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "Ongoing" ? "bg-emerald-500" : status === "Upcoming" ? "bg-amber-500" : "bg-blue-500")} />
      {status}
    </span>
  );
}

function ProgressBar({ status }: { status: string }) {
  const pct = status === "Completed" ? 100 : status === "Ongoing" ? 60 : 10;
  const color = status === "Completed" ? "bg-blue-500" : status === "Ongoing" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function BatchesPage() {
  const { data: batches, isLoading, error, createRecord, updateRecord, deleteRecord, refresh } = useSheetsData<Batch>("Batches");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return batches;
    return batches.filter((b) => b.Status === statusFilter);
  }, [batches, statusFilter]);

  const stats = useMemo(() => ({
    total: batches.length,
    ongoing: batches.filter((b) => b.Status === "Ongoing").length,
    upcoming: batches.filter((b) => b.Status === "Upcoming").length,
    completed: batches.filter((b) => b.Status === "Completed").length,
  }), [batches]);

  const handleSave = useCallback(async (data: Partial<Batch>) => {
    const ok = editingBatch ? await updateRecord({ ...data, "Batch ID": editingBatch["Batch ID"] }) : await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingBatch(null); }
  }, [editingBatch, updateRecord, createRecord]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRecord({ "Batch ID": deleteTarget["Batch ID"] });
    setDeleteTarget(null);
  };

  const columns: Column<Batch>[] = [
    {
      key: "Batch Name",
      label: "Batch",
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card-hover-bg text-xs font-bold text-muted-foreground">
            {b["Batch Name"]?.charAt(0) || "B"}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{b["Batch Name"]}</p>
            <p className="text-xs text-muted-foreground/60">ID: {b["Batch ID"]}</p>
          </div>
        </div>
      ),
    },
    {
      key: "Course",
      label: "Course",
      render: (b) => <span className="text-sm text-muted-foreground">{b.Course}</span>,
    },
    {
      key: "Trainer",
      label: "Trainer",
      render: (b) => <span className="text-sm text-muted-foreground">{b.Trainer}</span>,
    },
    {
      key: "Start Date",
      label: "Start Date",
      render: (b) => (
        <span className="text-sm text-muted-foreground">
          {b["Start Date"] ? new Date(b["Start Date"]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
        </span>
      ),
    },
    {
      key: "Status",
      label: "Status",
      render: (b) => <StatusBadge status={b.Status} />,
    },
    {
      key: "progress",
      label: "Progress",
      sortable: false,
      render: (b) => <ProgressBar status={b.Status} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      cellClass: "text-right",
      render: (b) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 border-border bg-popover/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={() => { setEditingBatch(b); setIsDialogOpen(true); }}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(b)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Layers, label: "Total Batches", value: stats.total, desc: "All training groups" },
          { icon: PlayCircle, label: "Ongoing", value: stats.ongoing, desc: "Currently active" },
          { icon: Clock, label: "Upcoming", value: stats.upcoming, desc: "Not yet started" },
          { icon: CheckCircle2, label: "Completed", value: stats.completed, desc: "Finished" },
        ].map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className="border-border bg-card shadow-none transition-all duration-200 hover:border-border">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card-hover-bg">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Batches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/70">Manage training batches, schedules, trainers, and progress.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingBatch(null); }}>
            <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Batch</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <DialogContent className="border-border bg-popover/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader><DialogTitle>{editingBatch ? "Edit Batch" : "Create Batch"}</DialogTitle></DialogHeader>
              <BatchForm initialData={editingBatch} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36 border-border bg-card-hover-bg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover/95 backdrop-blur-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Ongoing">Ongoing</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable<Batch>
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
        searchFields={["Batch Name", "Course", "Trainer"]}
        searchPlaceholder="Search batches..."
        emptyTitle="No batches yet"
        emptyDescription="Create your first batch to start managing courses, trainers, and student progress."
        emptyAction={<Button onClick={() => setIsDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Batch</Button>}
        rowKey={(b) => b["Batch ID"] || Math.random().toString()}
        pageSize={10}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="border-border bg-popover/95 backdrop-blur-xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Delete Batch</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.["Batch Name"]}&rdquo;</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
