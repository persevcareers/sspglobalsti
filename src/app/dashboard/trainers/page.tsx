"use client";

import { useState } from "react";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Trainer } from "@/types";
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
import { TrainerForm } from "@/components/forms/TrainerForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TrainersPage() {
  const { data: trainers, isLoading, createRecord, updateRecord, deleteRecord } = useSheetsData<Trainer>("Trainers");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.Specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (trainerData: Partial<Trainer>) => {
    let success = false;
    if (editingTrainer) {
      success = await updateRecord({ ...trainerData, "Trainer ID": editingTrainer["Trainer ID"] });
    } else {
      success = await createRecord(trainerData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingTrainer(null);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setIsDialogOpen(true);
  };

  const handleDelete = async (trainer: Trainer) => {
    if (confirm(`Are you sure you want to delete trainer ${trainer.Name}?`)) {
      await deleteRecord({ "Trainer ID": trainer["Trainer ID"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTrainer(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Trainer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTrainer ? "Edit Trainer" : "Add New Trainer"}</DialogTitle>
            </DialogHeader>
            <TrainerForm initialData={editingTrainer} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search trainers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Specialization</TableHead>
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
            ) : filteredTrainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No trainers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTrainers.map((trainer, index) => (
                <TableRow key={trainer["Trainer ID"] || index}>
                  <TableCell className="font-medium">{trainer.Name}</TableCell>
                  <TableCell>{trainer.Email}</TableCell>
                  <TableCell>{trainer.Phone}</TableCell>
                  <TableCell>{trainer.Specialization}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${trainer.Status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {trainer.Status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(trainer)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(trainer)}>Delete</Button>
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
