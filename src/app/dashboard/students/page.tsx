"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
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
import { StudentForm } from "@/components/forms/StudentForm";
import { DataTable, Column } from "@/components/tables/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatsGrid, StatCardDef } from "@/components/dashboard/stats-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { fadeIn } from "@/lib/animations";
import { Plus, Download, Pencil, Trash2, MoreHorizontal, Users, UserPlus, GraduationCap, TrendingUp } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/utils";

export default function StudentsPage() {
  const { data: students, isLoading, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<Student>("Students");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const stats: StatCardDef[] = useMemo(() => [
    { icon: Users, label: "Total Students", value: students.length, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: UserPlus, label: "Active", value: students.filter((s) => s.Status === "Active").length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: GraduationCap, label: "Completed", value: students.filter((s) => s.Status === "Completed").length, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: TrendingUp, label: "Avg Progress", value: students.length ? Math.round(students.reduce((sum, s) => sum + (Number(s["Progress Percentage"]) || 0), 0) / students.length) + "%" : "—", color: "text-amber-500", bg: "bg-amber-500/10" },
  ], [students]);

  const handleSave = useCallback(async (data: Partial<Student>) => {
    let ok = false;
    if (editingStudent) ok = await updateRecord({ ...data, "Student ID": editingStudent["Student ID"] });
    else ok = await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingStudent(null); }
  }, [editingStudent, updateRecord, createRecord]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRecord({ "Student ID": deleteTarget["Student ID"] });
    setDeleteTarget(null);
  };

  const columns: Column<Student>[] = [
    {
      key: "Full Name",
      label: "Name",
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getAvatarColor(s["Full Name"] || "S")} text-xs font-bold`}>
            {getInitials(s["Full Name"] || "S")}
          </div>
          <div>
            <p className="text-sm font-medium">{s["Full Name"]}</p>
            <p className="text-xs text-muted-foreground">{s["Email"]}</p>
          </div>
        </div>
      ),
    },
    { key: "Course", label: "Course", render: (s) => <span className="text-sm">{s["Course"] || "—"}</span> },
    { key: "Batch", label: "Batch", render: (s) => <span className="text-sm">{s["Batch"] || "—"}</span> },
    {
      key: "Status",
      label: "Status",
      render: (s) => <StatusBadge status={s.Status} />,
    },
    {
      key: "Progress Percentage",
      label: "Progress",
      render: (s) => {
        const pct = Number(s["Progress Percentage"]) || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${pct === 100 ? "bg-blue-500" : pct >= 60 ? "bg-emerald-500" : pct >= 30 ? "bg-amber-500" : "bg-rose-500"}`}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </div>
        );
      },
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
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => { setEditingStudent(s); setIsDialogOpen(true); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
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

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage enrolled students, track progress, and view performance."
        action={
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => exportToCSV(students, "students")}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingStudent(null); }}>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingStudent ? "Edit Student" : "Create Student"}</DialogTitle>
                </DialogHeader>
                <StudentForm initialData={editingStudent} onSave={handleSave} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <StatsGrid stats={stats} isLoading={isLoading} />

      <DataTable<Student>
        data={students}
        columns={columns}
        isLoading={isLoading}
        onRetry={refresh}
        searchFields={["Full Name", "Email", "Course", "Batch"]}
        searchPlaceholder="Search students..."
        emptyTitle="No students yet"
        emptyDescription="Enroll your first student to start tracking progress."
        emptyAction={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        }
        rowKey={(s) => s["Student ID"] || Math.random().toString()}
        pageSize={10}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Student"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.["Full Name"]}&rdquo;</span>?
            This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
