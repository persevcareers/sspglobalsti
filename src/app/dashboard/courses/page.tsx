"use client";

import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import type { Course } from "@/types";
import {
  Search,
  Plus,
  BookOpen,
  GraduationCap,
  Clock,
  Library,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Archive,
  FileDown,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Container,
  Cloud,
  Code,
  Shield,
  Monitor,
  Database,
  Brain,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CourseForm } from "@/components/forms/CourseForm";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { cn, getStatusColor } from "@/lib/utils";
import { fadeIn, staggerContainer, statCardVariants, tableRowVariants } from "@/lib/animations";
import { exportToCSV } from "@/lib/export-utils";
import { INPUT_CLASS } from "@/constants/styles";

const MODULE_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  devops: { label: "DevOps", icon: Container, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  cloud: { label: "Cloud", icon: Cloud, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  monitoring: { label: "Monitoring", icon: Monitor, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  security: { label: "Security", icon: Shield, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  programming: { label: "Programming", icon: Code, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  database: { label: "Database", icon: Database, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  ai: { label: "AI/ML", icon: Brain, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  default: { label: "Module", icon: Terminal, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/docker|kubernetes|k8s|jenkins|ansible|terraform|ci\/cd|gitlab/i, "devops"],
  [/aws|azure|gcp|cloud|lambda|s3|ec2/i, "cloud"],
  [/prometheus|grafana|monitoring|alertmanager|datadog/i, "monitoring"],
  [/security|cyber|penetration|firewall|encrypt|auth/i, "security"],
  [/python|javascript|typescript|java|c\+\+|react|node|angular|vue|html|css|rust|go|golang|swift|kotlin|\.net|c#|ruby|php/i, "programming"],
  [/sql|nosql|mongodb|postgresql|mysql|redis|dynamodb|cassandra|oracle|mariadb/i, "database"],
  [/machine learning|deep learning|ai|ml|tensorflow|pytorch|nlp|neural|llm|gpt|openai/i, "ai"],
];

function categorizeModule(name: string): { category: string; icon: React.ElementType; color: string } {
  for (const [regex, key] of CATEGORY_KEYWORDS) {
    if (regex.test(name.trim())) {
      const cat = MODULE_CATEGORIES[key];
      return { category: cat.label, icon: cat.icon, color: cat.color };
    }
  }
  const def = MODULE_CATEGORIES.default;
  return { category: def.label, icon: def.icon, color: def.color };
}

const modulesCache = new Map<string, string[]>();

function getModules(modulesStr: string): string[] {
  if (modulesCache.has(modulesStr)) return modulesCache.get(modulesStr)!;
  const result = modulesStr
    ? modulesStr.split(",").map((m) => m.trim()).filter(Boolean)
    : [];
  modulesCache.set(modulesStr, result);
  return result;
}

function ModuleChip({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const { icon: Icon, color } = useMemo(() => categorizeModule(name), [name]);
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm",
              color,
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]"
            )}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-2.5 w-2.5"} />
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] border border-border bg-popover/95 backdrop-blur-xl text-xs">
          <div className="space-y-1">
            <p className="font-medium text-foreground">{name}</p>
            <p className="text-muted-foreground">
              Category: <span className="text-foreground">{categorizeModule(name).category}</span>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ModuleAccordion({ modules }: { modules: string[] }) {
  const categorized = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of modules) {
      const { category } = categorizeModule(m);
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(m);
    }
    return Array.from(map.entries());
  }, [modules]);

  return (
    <div className="space-y-3">
      {categorized.map(([category, items]) => {
        const cat = Object.values(MODULE_CATEGORIES).find((c) => c.label === category) || MODULE_CATEGORIES.default;
        const Icon = cat.icon;
        return (
          <div key={category}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</span>
              <span className="text-[10px] text-muted-foreground/50">({items.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((m) => (
                <ModuleChip key={m} name={m} size="xs" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CourseDetail {
  course: Course;
  modules: string[];
  moduleCount: number;
}

function CourseDetailDrawer({
  course,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  course: CourseDetail | null;
  open: boolean;
  onClose: () => void;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
}) {
  if (!course) return null;
  const { modules, moduleCount } = course;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full border-border bg-popover/95 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="pb-0">
          <SheetTitle className="text-xl">{course.course["Course Name"]}</SheetTitle>
          <div className="mt-1 flex items-center gap-3">
            <Badge variant="outline" className={cn("border", getStatusColor(course.course.Status.toLowerCase()))}>
              {course.course.Status}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {course.course.Duration || "N/A"}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              {moduleCount} modules
            </span>
          </div>
          <SheetDescription className="mt-3 text-sm text-muted-foreground/70">
            {modules.slice(0, 3).join(", ")}
            {moduleCount > 3 ? ` and ${moduleCount - 3} more` : ""}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4 bg-border" />

        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-8 scrollbar-thin">
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Learning Path</h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {modules.slice(0, 8).map((m, i) => (
                <span key={m} className="flex items-center gap-1">
                  <ModuleChip name={m} size="xs" />
                  {i < Math.min(modules.length - 1, 7) && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                  )}
                </span>
              ))}
              {moduleCount > 8 && (
                <span className="text-[10px] text-muted-foreground/50">+{moduleCount - 8} more</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">All Modules</h4>
            <ModuleAccordion modules={modules} />
          </div>

          <Separator className="bg-border" />

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Duration", value: course.course.Duration || "N/A", icon: Clock },
              { label: "Total Modules", value: String(moduleCount), icon: BookOpen },
              { label: "Status", value: course.course.Status, icon: AlertCircle },
              { label: "Course ID", value: course.course["Course ID"]?.slice(0, 12) + "...", icon: Library },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border bg-card-hover-bg p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { onEdit(course.course); onClose(); }}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-red-400 hover:text-red-300" onClick={() => { onDelete(course.course); onClose(); }}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CourseRow({
  course,
  index,
  searchTerm,
  onEdit,
  onDelete,
  onView,
}: {
  course: Course;
  index: number;
  searchTerm: string;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onView: (c: Course) => void;
}) {
  const modules = useMemo(() => getModules(course.Modules), [course.Modules]);
  const visibleModules = modules.slice(0, 5);
  const overflow = modules.length - 5;

  return (
    <motion.tr
      custom={index}
      variants={tableRowVariants}
      initial="hidden"
      animate="visible"
      className="group cursor-pointer border-b border-border/40 transition-all duration-200 hover:bg-card-hover-bg"
      onClick={() => onView(course)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${course["Course Name"]}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onView(course); }}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card-hover-bg transition-all group-hover:bg-card-hover-bg">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{course["Course Name"]}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/60 line-clamp-1">{modules.slice(0, 3).join(", ")}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {visibleModules.map((m) => (
            <ModuleChip key={m} name={m} />
          ))}
          {overflow > 0 && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-card-hover-bg px-2.5 py-1 text-[11px] font-medium text-muted-foreground/70 transition-all duration-200 hover:bg-card-hover-bg hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); onView(course); }}
                  >
                    +{overflow} more
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="border border-border bg-popover/95 backdrop-blur-xl">
                  <p className="text-xs">{modules.slice(5).join(", ")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>
      <td className="hidden px-4 py-4 md:table-cell">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {course.Duration || "—"}
        </div>
      </td>
      <td className="hidden px-4 py-4 lg:table-cell">
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", getStatusColor(course.Status.toLowerCase()))}>
          {course.Status}
        </span>
      </td>
      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Course actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-border bg-popover/95 backdrop-blur-xl">
            <DropdownMenuItem onClick={() => onEdit(course)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView(course)}>
              <ExternalLink className="h-3.5 w-3.5" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(course)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
}

function MobileCourseCard({
  course,
  index,
  onEdit,
  onDelete,
  onView,
}: {
  course: Course;
  index: number;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onView: (c: Course) => void;
}) {
  const modules = useMemo(() => getModules(course.Modules), [course.Modules]);
  const visibleModules = modules.slice(0, 3);
  const overflow = modules.length - 3;

  return (
    <motion.div
      custom={index}
      variants={tableRowVariants}
      initial="hidden"
      animate="visible"
      className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:bg-card-hover-bg"
      onClick={() => onView(course)}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${course["Course Name"]}`}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onView(course); }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-medium text-foreground">{course["Course Name"]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            {course.Duration}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusColor(course.Status.toLowerCase()))}>
          {course.Status}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {visibleModules.map((m) => (
          <ModuleChip key={m} name={m} size="xs" />
        ))}
        {overflow > 0 && (
          <span className="inline-flex items-center rounded-full border border-border bg-card-hover-bg px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70">
            +{overflow} more
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
        <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onEdit(course); }}>
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button variant="ghost" size="xs" className="gap-1 text-red-400" onClick={(e) => { e.stopPropagation(); onDelete(course); }}>
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
}



export default function CoursesPage() {
  const { data: courses, isLoading, error, refresh, createRecord, updateRecord, deleteRecord } = useSheetsData<Course>("Courses");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !debouncedSearch ||
        course["Course Name"]?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.Modules?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.Duration?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || course.Status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [courses, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.Status === "Active").length;
    const inactive = total - active;
    const totalModules = courses.reduce((sum, c) => sum + getModules(c.Modules).length, 0);
    return { total, active, inactive, totalModules };
  }, [courses]);

  const handleSave = useCallback(async (courseData: Partial<Course>) => {
    const success = editingCourse
      ? await updateRecord({ ...courseData, "Course ID": editingCourse["Course ID"] })
      : await createRecord(courseData);
    if (success) {
      setIsDialogOpen(false);
      setEditingCourse(null);
    }
  }, [editingCourse, updateRecord, createRecord]);

  const handleEdit = useCallback((course: Course) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (course: Course) => {
    if (confirm(`Delete course "${course["Course Name"]}"? This action cannot be undone.`)) {
      await deleteRecord({ "Course ID": course["Course ID"] });
    }
  }, [deleteRecord]);

  const handleView = useCallback((course: Course) => {
    const modules = getModules(course.Modules);
    setSelectedCourse({ course, modules, moduleCount: modules.length });
    setDrawerOpen(true);
  }, []);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Total Courses", value: stats.total, icon: Library, desc: "All programs" },
          { label: "Active Courses", value: stats.active, icon: GraduationCap, desc: "Currently running" },
          { label: "Inactive", value: stats.inactive, icon: Archive, desc: "Archived courses" },
          { label: "Total Modules", value: stats.totalModules, icon: BookOpen, desc: "Across all courses" },
        ].map(({ label, value, icon: Icon, desc }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className="border-border bg-card shadow-none transition-all duration-200 hover:border-card-hover-bg">
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

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage learning programs, modules, and training paths.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-border text-xs" onClick={() => exportToCSV(courses, "Courses_Export")}>
            <FileDown className="h-3.5 w-3.5" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditingCourse(null); }}>
            <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Course
            </Button>
            <DialogContent className="border-border bg-popover/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              </DialogHeader>
              <CourseForm initialData={editingCourse} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            placeholder="Search courses, modules, duration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(INPUT_CLASS, "w-full pl-9")}
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "Active", "Inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                statusFilter === s
                  ? "bg-accent-soft text-accent-base"
                  : "text-muted-foreground/60 hover:bg-card-hover-bg hover:text-muted-foreground"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
          <Separator orientation="vertical" className="mx-1 h-5 bg-border" />
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground/60">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <TableSkeleton rows={6} />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load courses"
          message={error}
          onRetry={refresh}
        />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No courses match your filters" : "No courses yet"}
          description={searchTerm || statusFilter !== "all" ? "Try adjusting your search or filter criteria." : "Get started by adding your first course."}
          icon={BookOpen}
          action={
            !searchTerm && statusFilter === "all" ? (
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Course
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    {["Course Name", "Modules", "Duration", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course, i) => (
                    <CourseRow
                      key={course["Course ID"] || i}
                      course={course}
                      index={i}
                      searchTerm={searchTerm}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {filteredCourses.map((course, i) => (
              <MobileCourseCard
                key={course["Course ID"] || i}
                course={course}
                index={i}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        </>
      )}

      {/* Detail Drawer */}
      <CourseDetailDrawer
        course={selectedCourse}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedCourse(null); }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </motion.div>
  );
}
