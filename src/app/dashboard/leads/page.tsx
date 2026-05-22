"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import type { Lead } from "@/types";
import {
  Search,
  Plus,
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  User,
  Calendar,
  BookOpen,
  Camera,
  Briefcase,
  Play,
  MessageCircle,
  Globe,
  Link2,
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
import { LeadForm } from "@/components/forms/LeadForm";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { cn, getStatusColor } from "@/lib/utils";
import { fadeIn, staggerContainer, statCardVariants, tableRowVariants } from "@/lib/animations";
import { INPUT_CLASS } from "@/constants/styles";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  Instagram: Camera, LinkedIn: Briefcase, YouTube: Play, WhatsApp: MessageCircle, Website: Globe, Referral: Link2,
};

const SOURCE_COLORS: Record<string, string> = {
  Instagram: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  LinkedIn: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  YouTube: "text-red-400 bg-red-500/10 border-red-500/20",
  WhatsApp: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Website: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  Referral: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const SOURCES = ["Instagram", "LinkedIn", "YouTube", "WhatsApp", "Website", "Referral"] as const;
const STATUSES = ["New", "Contacted", "Converted", "Lost"] as const;

function SourceBadge({ source }: { source: string }) {
  const Icon = SOURCE_ICONS[source] || User;
  const colors = SOURCE_COLORS[source] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", colors)}>
      <Icon className="h-3 w-3" />
      {source}
    </span>
  );
}

function LeadDetailDrawer({
  lead,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  if (!lead) return null;
  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-lg">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]"><User className="h-6 w-6 text-muted-foreground" /></div>
            <div>
              <SheetTitle className="text-xl">{lead["Lead Name"]}</SheetTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("border", getStatusColor(lead.Status.toLowerCase()))}>{lead.Status}</Badge>
                <SourceBadge source={lead.Source} />
              </div>
            </div>
          </div>
          <SheetDescription className="mt-3 text-sm text-muted-foreground/70">{lead.Contact}</SheetDescription>
        </SheetHeader>
        <Separator className="my-4 bg-white/[0.06]" />
        <div className="space-y-4 px-4 pb-8">
          <div className="grid gap-3">
            {[
              { icon: User, label: "Contact", value: lead.Contact || "—" },
              { icon: BookOpen, label: "Interested Course", value: lead["Interested Course"] || "—" },
              { icon: Calendar, label: "Follow-up Date", value: lead["Follow-up Date"] || "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50"><Icon className="h-3 w-3" />{label}</div>
                <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { onEdit(lead); onClose(); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-red-400 hover:text-red-300" onClick={() => { onDelete(lead); onClose(); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function LeadsPage() {
  const { data: leads, isLoading, error, refresh, createRecord, updateRecord, deleteRecord } = useSheetsData<Lead>("Leads");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || l["Lead Name"]?.toLowerCase().includes(q) || l.Contact?.toLowerCase().includes(q) || l["Interested Course"]?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || l.Status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter((l) => l.Status === "New").length;
    const contacted = leads.filter((l) => l.Status === "Contacted").length;
    const converted = leads.filter((l) => l.Status === "Converted").length;
    const lost = leads.filter((l) => l.Status === "Lost").length;
    return { total, new: newLeads, contacted, converted, lost };
  }, [leads]);

  const handleSave = useCallback(async (data: Partial<Lead>) => {
    const ok = editingLead ? await updateRecord({ ...data, "Lead ID": editingLead["Lead ID"] }) : await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingLead(null); }
  }, [editingLead, updateRecord, createRecord]);

  const handleEdit = useCallback((l: Lead) => { setEditingLead(l); setIsDialogOpen(true); }, []);
  const handleDelete = useCallback(async (l: Lead) => {
    if (confirm(`Delete lead "${l["Lead Name"]}"?`)) await deleteRecord({ "Lead ID": l["Lead ID"] });
  }, [deleteRecord]);
  const handleView = useCallback((l: Lead) => { setSelectedLead(l); setDrawerOpen(true); }, []);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total Leads", value: stats.total, desc: "All prospects" },
          { icon: UserPlus, label: "New", value: stats.new, desc: "Not contacted yet" },
          { icon: PhoneCall, label: "Contacted", value: stats.contacted, desc: "In progress" },
          { icon: CheckCircle2, label: "Converted", value: stats.converted, desc: "Successfully enrolled" },
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Track prospects, manage follow-ups, and monitor conversions.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditingLead(null); }}>
          <Button size="sm" className="gap-1.5" onClick={() => setIsDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Lead</Button>
          <DialogContent className="border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle></DialogHeader>
            <LeadForm initialData={editingLead} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input placeholder="Search leads by name, contact, course..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={cn(INPUT_CLASS, "w-full pl-9")} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setStatusFilter("all")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === "all" ? "bg-accent-soft text-accent-base" : "text-muted-foreground/60 hover:bg-white/[0.04]")}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200", statusFilter === s ? "bg-accent-soft text-accent-base" : "text-muted-foreground/60 hover:bg-white/[0.04]")}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/[0.06] bg-card p-4"><TableSkeleton rows={6} /></div>
      ) : error ? (
        <ErrorState title="Failed to load leads" message={error} onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={searchTerm || statusFilter !== "all" ? "No leads match your filters" : "No leads yet"}
          description="Get started by adding your first lead."
          icon={Users}
          action={!searchTerm && statusFilter === "all" ? <Button onClick={() => setIsDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Add Your First Lead</Button> : undefined}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/[0.06] bg-card md:block">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Lead", "Contact", "Source", "Course", "Status", "Follow-up", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => (
                    <motion.tr key={lead["Lead ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                      className="group cursor-pointer border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.03]"
                      onClick={() => handleView(lead)} tabIndex={0} role="button" aria-label={`View details for ${lead["Lead Name"]}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(lead); }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] transition-all group-hover:bg-white/[0.08]"><User className="h-4 w-4 text-muted-foreground" /></div>
                          <p className="font-medium text-foreground">{lead["Lead Name"]}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{lead.Contact}</td>
                      <td className="hidden px-4 py-4 sm:table-cell"><SourceBadge source={lead.Source} /></td>
                      <td className="hidden px-4 py-4 lg:table-cell text-sm text-muted-foreground">{lead["Interested Course"] || "—"}</td>
                      <td className="hidden px-4 py-4 sm:table-cell">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", getStatusColor(lead.Status.toLowerCase()))}>{lead.Status}</span>
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell text-sm text-muted-foreground">{lead["Follow-up Date"] || "—"}</td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Lead actions"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 border-white/[0.06] bg-[#111118]/95 backdrop-blur-xl">
                            <DropdownMenuItem onClick={() => handleEdit(lead)}><Pencil className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleView(lead)}><ExternalLink className="h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(lead)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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
            {filtered.map((lead, i) => (
              <motion.div key={lead["Lead ID"] || i} custom={i} variants={tableRowVariants} initial="hidden" animate="visible"
                className="cursor-pointer rounded-xl border border-white/[0.06] bg-card p-4 transition-all duration-200 hover:bg-white/[0.03]"
                onClick={() => handleView(lead)} tabIndex={0} role="button"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleView(lead); }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]"><User className="h-4 w-4 text-muted-foreground" /></div>
                    <div><p className="font-medium text-foreground">{lead["Lead Name"]}</p><p className="text-xs text-muted-foreground/60">{lead.Contact}</p></div>
                  </div>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", getStatusColor(lead.Status.toLowerCase()))}>{lead.Status}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <SourceBadge source={lead.Source} />
                  <span>{lead["Interested Course"]}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.04] pt-3">
                  <Button variant="ghost" size="xs" className="gap-1 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}><Pencil className="h-3 w-3" />Edit</Button>
                  <Button variant="ghost" size="xs" className="gap-1 text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(lead); }}><Trash2 className="h-3 w-3" />Delete</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <LeadDetailDrawer lead={selectedLead} open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedLead(null); }} onEdit={handleEdit} onDelete={handleDelete} />
    </motion.div>
  );
}
