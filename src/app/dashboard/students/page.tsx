"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import type { Student } from "@/types";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Clock,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  GraduationCap,
  Mail,
  BookOpen,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { StudentForm } from "@/components/forms/StudentForm";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { cn, getStatusColor } from "@/lib/utils";
import { fadeIn, staggerContainer, statCardVariants, tableRowVariants } from "@/lib/animations";
import { useDebounce } from "@/hooks/useDebounce";
import { INPUT_CLASS, FILTER_ACTIVE_CLASS } from "@/constants/styles";
const STATUSES = ["Active", "Completed", "Dropped", "On Hold"] as const;

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

function StudentDetailDrawer({
  student,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  student: Student | null;
  open: boolean;
  onClose: () => void;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
}) {
  if (!student) return null;
  const pct = Number(student["Progress Percentage"]) || 0;
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full border-border bg-popover/95 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card-hover-bg">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <SheetTitle className="text-xl">{student["Full Name"]}</SheetTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("border", getStatusColor(student.Status.toLowerCase()))}>{student.Status}</Badge>
                <span className="text-xs text-muted-foreground">ID: {student["Student ID"]?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
          <SheetDescription className="mt-3 text-sm text-muted-foreground/70">{student.Email}</SheetDescription>
        </SheetHeader>
        <Separator className="my-4 bg-border" />
        <div className="space-y-4 px-4 pb-8">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Progress</h4>
            <div className="rounded-lg border border-border bg-card-hover-bg p-3">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Completion</span><span className="text-sm font-medium">{pct}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                  className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500")} />
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { icon: Mail, label: "Email", value: student.Email },
              { icon: BookOpen, label: "Course", value: student.Course || "—" },
              { icon: Layers, label: "Batch", value: student.Batch || "—" },
              { icon: Clock, label: "Duration", value: `${student["Start Date"] || "—"} → ${student["End Date"] || "—"}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-card-hover-bg p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50"><Icon className="h-3 w-3" />{label}</div>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { onEdit(student); onClose(); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-red-400 hover:text-red-300" onClick={() => { onDelete(student); onClose(); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function StudentsPage() {
  const { data: students, isLoading, error, refresh, createRecord, updateRecord, deleteRecord } = useSheetsData<Student>("Students");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q || s["Full Name"]?.toLowerCase().includes(q) || s.Email?.toLowerCase().includes(q) || s.Course?.toLowerCase().includes(q) || s.Batch?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.Status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.Status === "Active").length;
    const completed = students.filter((s) => s.Status === "Completed").length;
    const dropped = students.filter((s) => s.Status === "Dropped" || s.Status === "On Hold").length;
    return { total, active, completed, dropped };
  }, [students]);

  const handleSave = useCallback(async (data: Partial<Student>) => {
    const ok = editingStudent ? await updateRecord({ ...data, "Student ID": editingStudent["Student ID"] }) : await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingStudent(null); }
  }, [editingStudent, updateRecord, createRecord]);

  const handleEdit = useCallback((s: Student) => { setEditingStudent(s); setIsDialogOpen(true); }, []);
  const handleDelete = useCallback(async (s: Student) => {
    if (confirm(`Delete student "${s["Full Name"]}"?`)) await deleteRecord({ "Student ID": s["Student ID"] });
  }, [deleteRecord]);
  const handleView = useCallback((s: Student) => { setSelectedStudent(s); setDrawerOpen(true); }, []);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total Students", value: stats.total, desc: "All enrollments" },
          { icon: UserCheck, label: "Active", value: stats.active, desc: "Currently enrolled" },
          { icon: Clock, label: "Completed", value: stats.completed, desc: "Graduated" },
          { icon: UserX, label: "Dropped/On Hold", value: stats.dropped, desc: "Inactive" },
        ].map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className="border-border bg-card shadow-none transition-all duration-200 hover:border-border">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card-hover-bg"><Icon className="h-4.5 w-4.5 text-muted-foreground" /></div>
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage student enrollments, progress tracking, and batch assignments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditingStudent(null); }}>
          <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Student</Button>
          <DialogContent className="border-border bg-popover/95 backdrop-blur-xl sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle></DialogHeader>
            <StudentForm initialData={editingStudent} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input placeholder="Search students by name, email, course, batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={cn(INPUT_CLASS, "w-full pl-9")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStatusFilter("all")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === "all" ? "bg-accent-soft text-accent-base" : "text-muted-foreground/60 hover:bg-card-hover-bg")}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === s ? "bg-accent-soft text-accent-base" : "text-muted-foreground/60 hover:bg-card-hover-bg")}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-4"><TableSkeleton rows={6} /></div>
      ) : error ? (
        <ErrorState title="Failed to load students" message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No students match your filters" : "No students yet"}
          description="Get started by adding your first student."
          icon={Users}
          action={!searchTerm && statusFilter === "all" ? <Button onClick={() => setIsDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Your First Student</Button> : undefined}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    {["Student", "Course & Batch", "Status", "Progress", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, i) => {
                    const pct = Number(student["Progress Percentage"]) || 0;
                    return (
                      <motion.tr key={student["Student ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                        className="group cursor-pointer border-b border-border/40 transition-all duration-200 hover:bg-card-hover-bg"
                        onClick={() => handleView(student)} tabIndex={0} role="button" aria-label={`View details for ${student["Full Name"]}`}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(student); }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card-hover-bg transition-all group-hover:bg-card-hover-bg"><GraduationCap className="h-4 w-4 text-muted-foreground" /></div>
                            <div>
                              <p className="font-medium text-foreground">{student["Full Name"]}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground/60"><Mail className="h-3 w-3" />{student.Email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <p className="text-sm text-foreground">{student.Course || "—"}</p>
                            <p className="text-xs text-muted-foreground/60">Batch: {student.Batch || "—"}</p>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 sm:table-cell">
                          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", getStatusColor(student.Status.toLowerCase()))}>{student.Status}</span>
                        </td>
                        <td className="hidden px-4 py-4 md:table-cell"><ProgressBar pct={pct} /></td>
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Student actions"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 border-border bg-popover/95 backdrop-blur-xl">
                              <DropdownMenuItem onClick={() => handleEdit(student)}><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleView(student)}><ExternalLink className="h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(student)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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

          <div className="grid gap-3 md:hidden">
            {filtered.map((student, i) => {
              const pct = Number(student["Progress Percentage"]) || 0;
              return (
                <motion.div key={student["Student ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                  className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:bg-card-hover-bg"
                  onClick={() => handleView(student)} tabIndex={0} role="button"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(student); }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card-hover-bg"><GraduationCap className="h-4 w-4 text-muted-foreground" /></div>
                      <div><p className="font-medium text-foreground">{student["Full Name"]}</p><p className="text-xs text-muted-foreground/60">{student.Course}</p></div>
                    </div>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusColor(student.Status.toLowerCase()))}>{student.Status}</span>
                  </div>
                  <ProgressBar pct={pct} />
                  <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                    <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleEdit(student); }}><Pencil className="h-3 w-3" />Edit</Button>
                    <Button variant="ghost" size="xs" className="gap-1 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(student); }}><Trash2 className="h-3 w-3" />Delete</Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <StudentDetailDrawer student={selectedStudent} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedStudent(null); }} onEdit={handleEdit} onDelete={handleDelete} />
    </motion.div>
  );
}
