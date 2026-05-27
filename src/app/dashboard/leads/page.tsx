"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Lead } from "@/types";
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
import { LeadForm } from "@/components/forms/LeadForm";
import { DataTable, Column } from "@/components/tables/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatsGrid, StatCardDef } from "@/components/dashboard/stats-grid";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { fadeIn } from "@/lib/animations";
import { Plus, Download, Pencil, Trash2, MoreHorizontal, Users, UserPlus, PhoneCall, TrendingUp } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/utils";

export default function LeadsPage() {
  const { data: leads, isLoading, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<Lead>("Leads");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const stats: StatCardDef[] = useMemo(() => [
    { icon: Users, label: "Total Leads", value: leads.length, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: UserPlus, label: "New", value: leads.filter((l) => l.Status === "New").length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: PhoneCall, label: "Contacted", value: leads.filter((l) => l.Status === "Contacted").length, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: TrendingUp, label: "Conversion Rate", value: leads.length ? Math.round((leads.filter((l) => l.Status === "Converted").length / leads.length) * 100) + "%" : "—", color: "text-blue-500", bg: "bg-blue-500/10" },
  ], [leads]);

  const handleSave = useCallback(async (data: Partial<Lead>) => {
    let ok = false;
    if (editingLead) ok = await updateRecord({ ...data, "Lead ID": editingLead["Lead ID"] });
    else ok = await createRecord(data);
    if (ok) { setIsDialogOpen(false); setEditingLead(null); }
  }, [editingLead, updateRecord, createRecord]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRecord({ "Lead ID": deleteTarget["Lead ID"] });
    setDeleteTarget(null);
  };

  const columns: Column<Lead>[] = [
    {
      key: "Lead Name",
      label: "Name",
      render: (l) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getAvatarColor(l["Lead Name"] || "L")} text-xs font-bold`}>
            {getInitials(l["Lead Name"] || "L")}
          </div>
          <p className="text-sm font-medium">{l["Lead Name"]}</p>
        </div>
      ),
    },
    { key: "Contact", label: "Contact", render: (l) => <span className="text-sm text-muted-foreground">{l.Contact || "—"}</span> },
    { key: "Interested Course", label: "Interest", render: (l) => <span className="text-sm">{l["Interested Course"] || "—"}</span> },
    { key: "Source", label: "Source", render: (l) => <span className="text-sm">{l.Source || "—"}</span> },
    {
      key: "Status",
      label: "Status",
      render: (l) => <StatusBadge status={l.Status} />,
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      cellClass: "text-right",
      render: (l) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => { setEditingLead(l); setIsDialogOpen(true); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(l)}>
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
        title="Leads"
        description="Track and manage prospective student inquiries and conversions."
        action={
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => exportToCSV(leads, "leads")}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingLead(null); }}>
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Lead</span>
                <span className="sm:hidden">Add</span>
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingLead ? "Edit Lead" : "Create Lead"}</DialogTitle>
                </DialogHeader>
                <LeadForm initialData={editingLead} onSave={handleSave} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <StatsGrid stats={stats} isLoading={isLoading} />

      <DataTable<Lead>
        data={leads}
        columns={columns}
        isLoading={isLoading}
        onRetry={refresh}
        searchFields={["Lead Name", "Contact", "Interested Course"]}
        searchPlaceholder="Search leads..."
        emptyTitle="No leads yet"
        emptyDescription="Add your first lead to start tracking prospective students."
        emptyAction={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        }
        rowKey={(l) => l["Lead ID"] || Math.random().toString()}
        pageSize={10}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Lead"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">&ldquo;{deleteTarget?.["Lead Name"]}&rdquo;</span>?
            This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
