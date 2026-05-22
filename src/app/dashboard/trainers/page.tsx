"use client";

import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import type { Trainer } from "@/types";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  BookOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  GraduationCap,
  Mail,
  Phone,
  Star,
  AlertTriangle,
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
import { TrainerForm } from "@/components/forms/TrainerForm";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { cn, getStatusColor } from "@/lib/utils";
import { fadeIn, staggerContainer, statCardVariants, tableRowVariants } from "@/lib/animations";
import { INPUT_CLASS } from "@/constants/styles";

function SpecializationChip({ name }: { name: string }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted-foreground/80 transition-all duration-200 hover:bg-white/[0.08] hover:text-foreground">
            <Star className="h-2.5 w-2.5" />
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="border border-white/[0.06] bg-[#1A1A22]/95 backdrop-blur-xl">
          <p className="text-xs">Specialization: {name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TrainerDetailDrawer({
  trainer,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  trainer: Trainer | null;
  open: boolean;
  onClose: () => void;
  onEdit: (t: Trainer) => void;
  onDelete: (t: Trainer) => void;
}) {
  if (!trainer) return null;
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <SheetTitle className="text-xl">{trainer.Name}</SheetTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("border", getStatusColor(trainer.Status.toLowerCase()))}>
                  {trainer.Status}
                </Badge>
              </div>
            </div>
          </div>
          <SheetDescription className="mt-3 text-sm text-muted-foreground/70">
            {trainer.Specialization}
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4 bg-white/[0.06]" />
        <div className="space-y-4 px-4 pb-8">
          <div className="grid gap-3">
            {[
              { icon: Mail, label: "Email", value: trainer.Email },
              { icon: Phone, label: "Phone", value: trainer.Phone || "—" },
              { icon: Star, label: "Specialization", value: trainer.Specialization || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { onEdit(trainer); onClose(); }}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-red-400 hover:text-red-300" onClick={() => { onDelete(trainer); onClose(); }}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function TrainersPage() {
  const { data: trainers, isLoading, error, refresh, createRecord, updateRecord, deleteRecord } = useSheetsData<Trainer>("Trainers");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return trainers.filter((t) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q || t.Name?.toLowerCase().includes(q) || t.Specialization?.toLowerCase().includes(q) || t.Email?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || t.Status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [trainers, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    const total = trainers.length;
    const active = trainers.filter((t) => t.Status === "Active").length;
    const inactive = total - active;
    const specializations = new Set(trainers.map((t) => t.Specialization).filter(Boolean));
    return { total, active, inactive, specializations: specializations.size };
  }, [trainers]);

  const handleSave = useCallback(async (data: Partial<Trainer>) => {
    const ok = editingTrainer ? await updateRecord({ ...data, "Trainer ID": editingTrainer["Trainer ID"] }) : await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingTrainer(null); }
  }, [editingTrainer, updateRecord, createRecord]);

  const handleEdit = useCallback((t: Trainer) => { setEditingTrainer(t); setIsDialogOpen(true); }, []);
  const handleDelete = useCallback(async (t: Trainer) => {
    if (confirm(`Delete trainer "${t.Name}"?`)) await deleteRecord({ "Trainer ID": t["Trainer ID"] });
  }, [deleteRecord]);
  const handleView = useCallback((t: Trainer) => { setSelectedTrainer(t); setDrawerOpen(true); }, []);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      {/* Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total Trainers", value: stats.total, desc: "All instructors" },
          { icon: UserCheck, label: "Active", value: stats.active, desc: "Currently teaching" },
          { icon: UserX, label: "Inactive", value: stats.inactive, desc: "Not teaching" },
          { icon: BookOpen, label: "Specializations", value: stats.specializations, desc: "Unique areas" },
        ].map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className="border-white/[0.06] bg-card shadow-none transition-all duration-200 hover:border-white/[0.10]">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Trainers</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage instructors, specializations, and teaching assignments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditingTrainer(null); }}>
          <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Trainer
          </Button>
          <DialogContent className="border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTrainer ? "Edit Trainer" : "Add New Trainer"}</DialogTitle>
            </DialogHeader>
            <TrainerForm initialData={editingTrainer} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input placeholder="Search trainers by name, specialization, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={cn(INPUT_CLASS, "w-full pl-9")} />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "Active", "Inactive"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === s ? "bg-accent-soft text-accent-base" : "text-muted-foreground/60 hover:bg-white/[0.04]")}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border border-white/[0.06] bg-card p-4"><TableSkeleton rows={6} /></div>
      ) : error ? (
        <ErrorState title="Failed to load trainers" message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No trainers match your filters" : "No trainers yet"}
          description="Get started by adding your first trainer."
          icon={Users}
          action={!searchTerm && statusFilter === "all" ? <Button onClick={() => setIsDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Your First Trainer</Button> : undefined}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border border-white/[0.06] bg-card md:block">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Trainer", "Contact", "Specialization", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((trainer, i) => (
                    <motion.tr
                      key={trainer["Trainer ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                      className="group cursor-pointer border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.03]"
                      onClick={() => handleView(trainer)} tabIndex={0} role="button"
                      aria-label={`View details for ${trainer.Name}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(trainer); }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] transition-all group-hover:bg-white/[0.08]">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{trainer.Name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{trainer.Email}</p>
                          {trainer.Phone && <p className="flex items-center gap-1.5 text-sm text-muted-foreground/60"><Phone className="h-3 w-3" />{trainer.Phone}</p>}
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 lg:table-cell">
                        <SpecializationChip name={trainer.Specialization} />
                      </td>
                      <td className="hidden px-4 py-4 sm:table-cell">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", getStatusColor(trainer.Status.toLowerCase()))}>{trainer.Status}</span>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Trainer actions"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => handleEdit(trainer)}><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleView(trainer)}><ExternalLink className="h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(trainer)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((trainer, i) => (
              <motion.div key={trainer["Trainer ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                className="cursor-pointer rounded-xl border border-white/[0.06] bg-card p-4 transition-all duration-200 hover:bg-white/[0.03]"
                onClick={() => handleView(trainer)} tabIndex={0} role="button"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(trainer); }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]"><GraduationCap className="h-4 w-4 text-muted-foreground" /></div>
                    <div><p className="font-medium text-foreground">{trainer.Name}</p><p className="text-xs text-muted-foreground/60">{trainer.Specialization}</p></div>
                  </div>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusColor(trainer.Status.toLowerCase()))}>{trainer.Status}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{trainer.Email}</span>
                  {trainer.Phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{trainer.Phone}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.04] pt-3">
                  <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleEdit(trainer); }}><Pencil className="h-3 w-3" />Edit</Button>
                  <Button variant="ghost" size="xs" className="gap-1 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(trainer); }}><Trash2 className="h-3 w-3" />Delete</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <TrainerDetailDrawer trainer={selectedTrainer} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedTrainer(null); }} onEdit={handleEdit} onDelete={handleDelete} />
    </motion.div>
  );
}
