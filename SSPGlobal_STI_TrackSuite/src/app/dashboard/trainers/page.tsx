"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Trainer } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrainerForm } from "@/components/forms/TrainerForm";
import { DataTable, Column } from "@/components/tables/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatsGrid, StatCardDef } from "@/components/dashboard/stats-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { fadeIn } from "@/lib/animations";
import { Plus, Download, Pencil, Trash2, MoreHorizontal, Users, UserCheck, BookOpen, GraduationCap } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/utils";

export default function TrainersPage() {
  const { data: trainers, isLoading, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<Trainer>("Trainers");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trainer | null>(null);

  const stats: StatCardDef[] = useMemo(() => [
    { icon: Users, label: "Total Trainers", value: trainers.length, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: UserCheck, label: "Active", value: trainers.filter((t) => t.Status === "Active").length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: BookOpen, label: "Specializations", value: [...new Set(trainers.map((t) => t.Specialization).filter(Boolean))].length, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: GraduationCap, label: "Inactive", value: trainers.filter((t) => t.Status !== "Active").length, color: "text-blue-500", bg: "bg-blue-500/10" },
  ], [trainers]);

  const handleSave = useCallback(async (data: Partial<Trainer>) => {
    let ok = false;
    if (editingTrainer) ok = await updateRecord({ ...data, "Trainer ID": editingTrainer["Trainer ID"] });
    else ok = await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingTrainer(null); }
  }, [editingTrainer, updateRecord, createRecord]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRecord({ "Trainer ID": deleteTarget["Trainer ID"] });
    setDeleteTarget(null);
  };

  const columns: Column<Trainer>[] = [
    {
      key: "Name",
      label: "Name",
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getAvatarColor(t.Name || "")} text-xs font-bold`}>
            {getInitials(t.Name || "T")}
          </div>
          <p className="text-sm font-medium">{t.Name}</p>
        </div>
      ),
    },
    { key: "Email", label: "Email", render: (t) => <span className="text-sm text-muted-foreground">{t.Email}</span> },
    { key: "Phone", label: "Phone", render: (t) => <span className="text-sm text-muted-foreground">{t.Phone || "—"}</span> },
    { key: "Specialization", label: "Specialization", render: (t) => <span className="text-sm">{t.Specialization || "—"}</span> },
    {
      key: "Status",
      label: "Status",
      render: (t) => <StatusBadge status={t.Status} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      cellClass: "text-right",
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => { setEditingTrainer(t); setIsDialogOpen(true); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(t)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Trainers"
        description="Manage trainers, their specializations, and assigned batches."
        action={
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTrainer(null); }}>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Trainer</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingTrainer ? "Edit Trainer" : "Create Trainer"}</DialogTitle>
                </DialogHeader>
                <TrainerForm initialData={editingTrainer} onSave={handleSave} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <StatsGrid stats={stats} isLoading={isLoading} />

      <DataTable<Trainer>
        data={trainers}
        columns={columns}
        isLoading={isLoading}
        onRetry={refresh}
        searchFields={["Name", "Email", "Specialization"]}
        searchPlaceholder="Search trainers..."
        emptyTitle="No trainers yet"
        emptyDescription="Add your first trainer to start managing training staff."
        emptyAction={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trainer
          </Button>
        }
        rowKey={(t) => t["Trainer ID"] || Math.random().toString()}
        pageSize={10}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Trainer"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.Name}&rdquo;</span>?
            This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
