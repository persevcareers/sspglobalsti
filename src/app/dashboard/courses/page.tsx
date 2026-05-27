"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseForm } from "@/components/forms/CourseForm";
import { DataTable, Column } from "@/components/tables/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatsGrid, StatCardDef } from "@/components/dashboard/stats-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { fadeIn } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  Plus, Download, Pencil, Trash2, MoreHorizontal, Eye, ChevronRight,
  BookOpen, Layers, Clock, Box, Code, Cloud, Brain, Shield, Database, Monitor,
} from "lucide-react";

const MODULE_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  devops: { label: "DevOps", icon: Box, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  cloud: { label: "Cloud", icon: Cloud, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  programming: { label: "Programming", icon: Code, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  ai: { label: "AI/ML", icon: Brain, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
  security: { label: "Security", icon: Shield, color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  database: { label: "Database", icon: Database, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  monitoring: { label: "Monitoring", icon: Monitor, color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
};

function categorizeModule(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("devops") || lower.includes("docker") || lower.includes("k8s") || lower.includes("kubernetes") || lower.includes("container")) return "devops";
  if (lower.includes("cloud") || lower.includes("aws") || lower.includes("azure") || lower.includes("gcp")) return "cloud";
  if (lower.includes("python") || lower.includes("javascript") || lower.includes("java") || lower.includes("react") || lower.includes("node") || lower.includes("programming")) return "programming";
  if (lower.includes("ai") || lower.includes("ml") || lower.includes("machine learning") || lower.includes("deep learning") || lower.includes("neural")) return "ai";
  if (lower.includes("security") || lower.includes("cyber") || lower.includes("penetration") || lower.includes("ethical")) return "security";
  if (lower.includes("sql") || lower.includes("database") || lower.includes("mysql") || lower.includes("mongodb") || lower.includes("db")) return "database";
  if (lower.includes("monitor") || lower.includes("grafana") || lower.includes("prometheus") || lower.includes("logging")) return "monitoring";
  return "programming";
}

function ModuleChip({ name }: { name: string }) {
  const cat = categorizeModule(name);
  const config = MODULE_CATEGORIES[cat];
  const Icon = config?.icon || Code;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all duration-200 hover:scale-105", config?.color || "bg-muted text-muted-foreground")}>
            <Icon className="h-2.5 w-2.5" />
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{name} — {config?.label || "General"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function CoursesPage() {
  const { data: courses, isLoading, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<Course>("Courses");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return courses;
    return courses.filter((c) => c.Status === statusFilter);
  }, [courses, statusFilter]);

  const parseModules = (modulesStr: string): string[] => {
    if (!modulesStr) return [];
    return modulesStr.split(",").map((m) => m.trim()).filter(Boolean);
  };

  const totalModules = courses.reduce((sum, c) => sum + parseModules(c.Modules).length, 0);

  const stats: StatCardDef[] = useMemo(() => [
    { icon: BookOpen, label: "Total Courses", value: courses.length, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: Layers, label: "Active", value: courses.filter((c) => c.Status === "Active").length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Clock, label: "Inactive", value: courses.filter((c) => c.Status === "Inactive").length, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Box, label: "Total Modules", value: totalModules, color: "text-blue-500", bg: "bg-blue-500/10" },
  ], [courses, totalModules]);

  const handleSave = useCallback(async (data: Partial<Course>) => {
    let ok = false;
    if (editingCourse) ok = await updateRecord({ ...data, "Course ID": editingCourse["Course ID"] });
    else ok = await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingCourse(null); }
  }, [editingCourse, updateRecord, createRecord]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRecord({ "Course ID": deleteTarget["Course ID"] });
    setDeleteTarget(null);
  };

  const columns: Column<Course>[] = [
    {
      key: "Course Name",
      label: "Course",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
            {c["Course Name"]?.charAt(0) || "C"}
          </div>
          <p className="text-sm font-medium">{c["Course Name"]}</p>
        </div>
      ),
    },
    {
      key: "Modules",
      label: "Modules",
      render: (c) => {
        const modules = parseModules(c.Modules);
        const visible = modules.slice(0, 5);
        const extra = modules.length - 5;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {visible.map((mod) => <ModuleChip key={mod} name={mod} />)}
            {extra > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground cursor-help">+{extra} more</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs"><p>{modules.slice(5).join(", ")}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    { key: "Duration", label: "Duration", render: (c) => <span className="text-sm text-muted-foreground">{c.Duration || "—"}</span> },
    {
      key: "Status",
      label: "Status",
      render: (c) => <StatusBadge status={c.Status} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      cellClass: "text-right",
      render: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setDetailCourse(c)}>
              <Eye className="mr-2 h-3.5 w-3.5" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditingCourse(c); setIsDialogOpen(true); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(c)}>
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
        title="Courses"
        description="Define courses, manage modules, and organize learning paths."
        action={
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => exportToCSV(courses, "courses")}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingCourse(null); }}>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Course</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? "Edit Course" : "Create Course"}</DialogTitle>
                </DialogHeader>
                <CourseForm initialData={editingCourse} onSave={handleSave} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <StatsGrid stats={stats} isLoading={isLoading} />

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable<Course>
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        onRetry={refresh}
        searchFields={["Course Name"]}
        searchPlaceholder="Search courses..."
        emptyTitle="No courses yet"
        emptyDescription="Create your first course to organize modules and learning paths."
        emptyAction={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        }
        rowKey={(c) => c["Course ID"] || Math.random().toString()}
        pageSize={10}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Course"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.["Course Name"]}&rdquo;</span>?
            This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
      />

      <Sheet open={!!detailCourse} onOpenChange={(o) => { if (!o) setDetailCourse(null); }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{detailCourse?.["Course Name"]}</SheetTitle>
            <SheetDescription>Course details and module breakdown</SheetDescription>
          </SheetHeader>
          {detailCourse && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Duration</p><p className="text-sm font-semibold mt-1">{detailCourse.Duration || "—"}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-semibold mt-1"><StatusBadge status={detailCourse.Status} /></p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Course ID</p><p className="text-sm font-semibold mt-1 font-mono">{detailCourse["Course ID"]}</p></div>
                <div className="rounded-lg bg-card p-3 border"><p className="text-xs text-muted-foreground">Modules</p><p className="text-sm font-semibold mt-1">{parseModules(detailCourse.Modules).length}</p></div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Learning Path</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {parseModules(detailCourse.Modules).map((mod, i, arr) => {
                    const cat = categorizeModule(mod);
                    const config = MODULE_CATEGORIES[cat];
                    const Icon = config?.icon || Code;
                    return (
                      <div key={mod} className="flex items-center gap-1">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", config?.color || "bg-muted")}>
                          <Icon className="h-3 w-3" />{mod}
                        </span>
                        {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Modules by Category</h4>
                {Object.entries(
                  parseModules(detailCourse.Modules).reduce((acc, mod) => {
                    const cat = categorizeModule(mod);
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(mod);
                    return acc;
                  }, {} as Record<string, string[]>)
                ).map(([cat, mods]) => {
                  const config = MODULE_CATEGORIES[cat];
                  const Icon = config?.icon || Code;
                  return (
                    <div key={cat} className="mb-2 rounded-lg border bg-card/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{config?.label || cat}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {mods.map((m) => <span key={m} className="text-xs text-muted-foreground">{m}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
