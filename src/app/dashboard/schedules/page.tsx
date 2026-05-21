"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { DailySchedule } from "@/types";
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
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  History,
  Trash2,
  Edit,
  Layers,
} from "lucide-react";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { modifySheetData, callSessionAction } from "@/services/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRawDateToISTDate,
  formatRawTimeToISTTime,
  parseToISTDateObject,
  determineAutoStatus,
  formatToISTDateTime,
} from "@/utils/dateUtils";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { fadeIn, tableRowVariants, statCardVariants } from "@/lib/animations";

// Helper component for bulk schedule creation
function BulkScheduleForm({
  onSave,
  isSubmitting,
}: {
  onSave: (data: { batchNames: string; date: string; startTime: string; notes: string }) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [batchNames, setBatchNames] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNames.trim() || !date || !startTime) {
      toast.error("Batch names, Date, and Start Time are required.");
      return;
    }
    await onSave({ batchNames, date, startTime, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bulk-batches">Batch Names (one per line or comma-separated)</Label>
        <Textarea
          id="bulk-batches"
          value={batchNames}
          onChange={(e) => setBatchNames(e.target.value)}
          placeholder="e.g.&#10;Python Batch A&#10;Python Batch B&#10;Web Dev Batch C"
          rows={4}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bulk-date">Schedule Date</Label>
          <Input
            id="bulk-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk-start">Start Time</Label>
          <Input
            id="bulk-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bulk-notes">Notes (applies to all created schedules)</Label>
        <Textarea
          id="bulk-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional instructions, topic details, etc..."
          rows={2}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating Bulk Schedules..." : "Create Bulk Schedules"}
      </Button>
    </form>
  );
}

export default function SchedulesPage() {
  const { data: schedules, isLoading, createRecord, updateRecord, deleteRecord, refresh } =
    useSheetsData<DailySchedule>("DailySchedules");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DailySchedule | null>(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // States for custom delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<DailySchedule | null>(null);

  // Generate dynamic, unique IDs for schedules
  const generateUniqueId = () => {
    return "TSK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
  };

  // Filter schedules based on search query
  const filteredSchedules = schedules.filter((schedule) => {
    const term = searchTerm.toLowerCase();
    return (
      schedule["Batch Name"]?.toLowerCase().includes(term) ||
      schedule["Notes"]?.toLowerCase().includes(term) ||
      schedule["Task ID"]?.toLowerCase().includes(term) ||
      schedule["Status"]?.toLowerCase().includes(term)
    );
  });

  // Sort: Date (ascending) -> Start Time (ascending) -> Batch Name (ascending)
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const timeA = parseToISTDateObject(a["Schedule Date"] || "", a["Start Time"] || "") || new Date(0);
    const timeB = parseToISTDateObject(b["Schedule Date"] || "", b["Start Time"] || "") || new Date(0);
    
    const diff = timeA.getTime() - timeB.getTime();
    if (diff !== 0) return diff;
    
    return (a["Batch Name"] || "").localeCompare(b["Batch Name"] || "");
  });

  // Calculate statistics for Dashboard-style cards
  const stats = {
    total: filteredSchedules.length,
    running: filteredSchedules.filter((s) => s.Status === "Running").length,
    completed: filteredSchedules.filter((s) => s.Status === "Completed").length,
    exceptions: filteredSchedules.filter((s) => ["Cancelled", "Holiday", "Postponed"].includes(s.Status)).length,
  };

  // Handle single schedule save (Create or Update)
  const handleSave = async (scheduleData: Partial<DailySchedule>) => {
    let success = false;
    if (editingSchedule) {
      success = await updateRecord({
        ...scheduleData,
        "Task ID": editingSchedule["Task ID"],
      });
    } else {
      success = await createRecord({
        ...scheduleData,
        "Task ID": generateUniqueId(),
      });
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingSchedule(null);
    }
  };

  // Handle bulk schedules creation
  const handleBulkSave = async (data: { batchNames: string; date: string; startTime: string; notes: string }) => {
    setIsBulkSubmitting(true);
    const batchList = data.batchNames
      .split(/[\n,]+/)
      .map((b) => b.trim())
      .filter(Boolean);

    if (batchList.length === 0) {
      toast.error("Please enter at least one batch name.");
      setIsBulkSubmitting(false);
      return;
    }

    try {
      const formattedDateVal = formatRawDateToISTDate(data.date);
      const formattedStartVal = formatRawTimeToISTTime(data.startTime);
      const nowIST = formatToISTDateTime(new Date());

      // Auto status determination (default Scheduled)
      const autoStatusVal = determineAutoStatus(formattedDateVal, formattedStartVal, "", "Scheduled");

      for (const batchName of batchList) {
        const payload: DailySchedule = {
          "Task ID": generateUniqueId(),
          "Batch Name": batchName,
          "Schedule Date": formattedDateVal,
          "Start Time": formattedStartVal,
          "End Time": "",
          Status: autoStatusVal,
          Duration: "",
          Notes: data.notes || "",
          "Last Updated Timestamp (IST)": nowIST,
          "Created Time (IST)": nowIST,
          "Modified Time (IST)": nowIST,
          "Last Status Change Time (IST)": nowIST,
        };
        await modifySheetData("create", "DailySchedules", payload);
      }

      toast.success(`Successfully created ${batchList.length} schedules.`);
      try {
        await callSessionAction("createNotification", {
          "User ID": "",
          Title: "Schedules Created",
          Message: `${batchList.length} schedule(s) created in bulk`,
          Type: "success",
          Link: "/dashboard/schedules",
        });
      } catch {
        console.warn("[Schedules] Failed to create notification");
      }
      setIsBulkDialogOpen(false);
      await refresh();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating bulk schedules.");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleEdit = (schedule: DailySchedule) => {
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  };

  const triggerDeletePrompt = (schedule: DailySchedule) => {
    setDeletingSchedule(schedule);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (deletingSchedule) {
      await deleteRecord({ "Task ID": deletingSchedule["Task ID"] });
      setIsDeleteOpen(false);
      setDeletingSchedule(null);
    }
  };

  // Returns style classes based on schedule status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60";
      case "Running":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 animate-pulse font-semibold";
      case "Completed":
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60";
      case "Holiday":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60";
      case "Postponed":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60";
      case "PAP":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-semibold";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Schedule Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage training routines, time blocks, and batch statuses with auto-IST synchronization.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Bulk Dialog */}
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Layers className="mr-2 h-4 w-4" />
                Bulk Add Batches
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Bulk Create Schedules</DialogTitle>
                <DialogDescription>
                  Create multiple batches at once with a shared date and time.
                </DialogDescription>
              </DialogHeader>
              <BulkScheduleForm onSave={handleBulkSave} isSubmitting={isBulkSubmitting} />
            </DialogContent>
          </Dialog>

          {/* Single Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingSchedule(null);
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingSchedule ? "Edit Schedule Entry" : "Add New Schedule"}</DialogTitle>
                <DialogDescription>
                  {editingSchedule ? "Update the details for this schedule block." : "Set up a new training schedule block."}
                </DialogDescription>
              </DialogHeader>
              <ScheduleForm initialData={editingSchedule} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="visible" className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10", label: "Total Schedules", value: stats.total },
          { icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Currently Running", value: stats.running },
          { icon: CheckCircle2, color: "text-teal-500", bg: "bg-teal-500/10", label: "Completed Tasks", value: stats.completed },
          { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Exceptions/Holidays", value: stats.exceptions },
        ].map((card, i) => (
          <motion.div key={card.label} custom={i} variants={statCardVariants} className="p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              <h3 className="text-xl font-bold">{isLoading ? "..." : card.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search Input */}
      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search batch, task ID, or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 bg-background/50 backdrop-blur-sm"
        />
      </div>

      {/* Schedules Table */}
      <div className="rounded-xl border bg-card/90 dark:bg-card/45 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Task ID</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Batch Name</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Schedule Date</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Start Time</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">End Time</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Duration</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider max-w-[200px]">Notes</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Updated (IST)</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <TableSkeleton rows={4} />
                  </TableCell>
                </TableRow>
              ) : sortedSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No daily schedules found matching your query.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSchedules.map((schedule, index) => (
                  <motion.tr
                    key={schedule["Task ID"] || index}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{schedule["Task ID"]}</TableCell>
                    <TableCell className="font-medium text-foreground">{schedule["Batch Name"]}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{schedule["Schedule Date"]}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3. w-3 text-indigo-400" />
                        {schedule["Start Time"]}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {schedule["End Time"] ? (
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3. w-3 text-teal-400" />
                          {schedule["End Time"]}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/45 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-xs ${getStatusBadgeClass(schedule.Status)}`}>
                        {schedule.Status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold whitespace-nowrap">
                      {schedule.Duration || <span className="text-muted-foreground/45 italic">-</span>}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={schedule.Notes}>
                      {schedule.Notes || <span className="text-muted-foreground/30 italic">None</span>}
                    </TableCell>
                    <TableCell 
                      className="text-xs text-right font-medium text-muted-foreground cursor-help whitespace-nowrap"
                      title={`Created: ${schedule["Created Time (IST)"] || 'N/A'}\nModified: ${schedule["Modified Time (IST)"] || 'N/A'}\nStatus Change: ${schedule["Last Status Change Time (IST)"] || 'N/A'}`}
                    >
                      <div className="inline-flex items-center space-x-1 justify-end">
                        <History className="h-3 w-3 text-muted-foreground/60" />
                        <span>{schedule["Last Updated Timestamp (IST)"]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => handleEdit(schedule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => triggerDeletePrompt(schedule)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Premium Confirm Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-semibold">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete the schedule entry for{" "}
              <span className="text-foreground font-semibold">
                &ldquo;{deletingSchedule ? deletingSchedule["Batch Name"] : ""}&rdquo;
              </span>
              ? This action is permanent and will delete the row from the database.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 border-t mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={executeDelete}>
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
