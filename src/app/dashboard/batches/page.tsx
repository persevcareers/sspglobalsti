"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Batch } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { fadeIn, statCardVariants, tableRowVariants } from "@/lib/animations";
import {
  Plus,
  Search,
  Download,
  GraduationCap,
  PlayCircle,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SortField = "Batch Name" | "Course" | "Trainer" | "Start Date" | "Status";
type SortDir = "asc" | "desc";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; dot: string; label: string }> = {
    Ongoing: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Ongoing" },
    Upcoming: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", label: "Upcoming" },
    Completed: { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500", label: "Completed" },
  };
  const c = config[status] || config.Upcoming;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function ProgressBar({ status }: { status: string }) {
  const pct = status === "Completed" ? 100 : status === "Ongoing" ? 60 : 10;
  const color = status === "Completed" ? "bg-blue-500" : status === "Ongoing" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Layers className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">No batches yet</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        Create your first batch to start managing courses, trainers, and student progress.
      </p>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Create Batch
      </Button>
    </motion.div>
  );
}

export default function BatchesPage() {
  const { data: batches, isLoading, error, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<Batch>("Batches");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("Start Date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const filtered = useMemo(() => {
    let result = [...batches];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b["Batch Name"]?.toLowerCase().includes(q) ||
          b.Course?.toLowerCase().includes(q) ||
          b.Trainer?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((b) => b.Status === statusFilter);
    }

    result.sort((a, b) => {
      const aVal = (a[sortField] || "").toString().toLowerCase();
      const bVal = (b[sortField] || "").toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [batches, searchTerm, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const total = batches.length;
    const ongoing = batches.filter((b) => b.Status === "Ongoing").length;
    const upcoming = batches.filter((b) => b.Status === "Upcoming").length;
    const completed = batches.filter((b) => b.Status === "Completed").length;
    return { total, ongoing, upcoming, completed };
  }, [batches]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleSave = useCallback(
    async (data: Partial<Batch>) => {
      let ok = false;
      if (editingBatch) {
        ok = await updateRecord({ ...data, "Batch ID": editingBatch["Batch ID"] });
      } else {
        ok = await createRecord(data);
      }
      if (ok) {
        setIsDialogOpen(false);
        setEditingBatch(null);
      }
    },
    [editingBatch, updateRecord, createRecord]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRecord({ "Batch ID": deleteTarget["Batch ID"] });
    setDeleteTarget(null);
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setIsDialogOpen(true);
  };

  const statCards = [
    { icon: Layers, label: "Total Batches", value: stats.total, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: PlayCircle, label: "Ongoing", value: stats.ongoing, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Clock, label: "Upcoming", value: stats.upcoming, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: CheckCircle2, label: "Completed", value: stats.completed, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  if (error) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h3 className="mb-2 text-lg font-semibold">Failed to load batches</h3>
        <p className="mb-4 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={refresh}>Try Again</Button>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage training batches, schedules, trainers, and progress.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingBatch(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Batch</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingBatch ? "Edit Batch" : "Create Batch"}</DialogTitle>
              </DialogHeader>
              <BatchForm initialData={editingBatch} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <motion.div
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={statCardVariants}
            className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{isLoading ? "—" : card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="h-9 pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            <SelectTrigger className="h-9 w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!isLoading && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} batch{filtered.length !== 1 ? "es" : ""}
          </p>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : paginated.length === 0 ? (
        <EmptyState onAdd={() => setIsDialogOpen(true)} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                  {(["Batch Name", "Course", "Trainer", "Start Date", "Status"] as const).map((field) => (
                    <TableHead key={field} className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <button
                        onClick={() => toggleSort(field)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {field === "Batch Name" ? "Batch" : field}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Progress
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((batch, index) => (
                  <motion.tr
                    key={batch["Batch ID"] || index}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="group border-b transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {batch["Batch Name"]?.charAt(0) || "B"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{batch["Batch Name"]}</p>
                          <p className="text-xs text-muted-foreground">ID: {batch["Batch ID"]}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm">{batch.Course || "—"}</TableCell>
                    <TableCell className="py-3 text-sm">{batch.Trainer || "—"}</TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      {batch["Start Date"]
                        ? new Date(batch["Start Date"]).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={batch.Status} />
                    </TableCell>
                    <TableCell className="py-3">
                      <ProgressBar status={batch.Status} />
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => handleEdit(batch)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(batch)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-0.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Batch
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.["Batch Name"]}&rdquo;</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
