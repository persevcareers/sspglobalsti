"use client";

import { useState } from "react";
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
import { Plus, Search, Loader2 } from "lucide-react";
import { BatchForm } from "@/components/forms/BatchForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BatchesPage() {
  const { data: batches, isLoading, createRecord, updateRecord, deleteRecord } = useSheetsData<Batch>("Batches");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const filteredBatches = batches.filter(
    (batch) =>
      batch["Batch Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.Course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.Trainer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (batchData: Partial<Batch>) => {
    let success = false;
    if (editingBatch) {
      success = await updateRecord({ ...batchData, "Batch ID": editingBatch["Batch ID"] });
    } else {
      success = await createRecord(batchData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingBatch(null);
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setIsDialogOpen(true);
  };

  const handleDelete = async (batch: Batch) => {
    if (confirm(`Are you sure you want to delete batch ${batch["Batch Name"]}?`)) {
      await deleteRecord({ "Batch ID": batch["Batch ID"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingBatch(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBatch ? "Edit Batch" : "Add New Batch"}</DialogTitle>
            </DialogHeader>
            <BatchForm initialData={editingBatch} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search batches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Trainer</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredBatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No batches found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBatches.map((batch, index) => (
                <TableRow key={batch["Batch ID"] || index}>
                  <TableCell className="font-medium">{batch["Batch Name"]}</TableCell>
                  <TableCell>{batch.Course}</TableCell>
                  <TableCell>{batch.Trainer}</TableCell>
                  <TableCell>
                    {batch["Start Date"] ? new Date(batch["Start Date"]).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      batch.Status === "Ongoing"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : batch.Status === "Completed"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }`}>
                      {batch.Status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(batch)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(batch)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
