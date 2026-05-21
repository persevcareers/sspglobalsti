"use client";

import { useState } from "react";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Lead } from "@/types";
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
import { LeadForm } from "@/components/forms/LeadForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LeadsPage() {
  const { data: leads, isLoading, createRecord, updateRecord, deleteRecord } = useSheetsData<Lead>("Leads");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(
    (lead) =>
      lead["Lead Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead["Contact"]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (leadData: Partial<Lead>) => {
    let success = false;
    if (editingLead) {
      success = await updateRecord({ ...leadData, "Lead ID": editingLead["Lead ID"] });
    } else {
      success = await createRecord(leadData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingLead(null);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsDialogOpen(true);
  };

  const handleDelete = async (lead: Lead) => {
    if (confirm(`Are you sure you want to delete lead ${lead["Lead Name"]}?`)) {
      await deleteRecord({ "Lead ID": lead["Lead ID"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLead(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
            </DialogHeader>
            <LeadForm initialData={editingLead} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Interested Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Follow-up Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead, index) => (
                <TableRow key={lead["Lead ID"] || index}>
                  <TableCell className="font-medium">{lead["Lead Name"]}</TableCell>
                  <TableCell>{lead["Contact"]}</TableCell>
                  <TableCell>{lead["Source"]}</TableCell>
                  <TableCell>{lead["Interested Course"]}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${lead.Status === 'Converted' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : lead.Status === 'Lost' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                      {lead["Status"]}
                    </span>
                  </TableCell>
                  <TableCell>{lead["Follow-up Date"]}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(lead)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(lead)}>Delete</Button>
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
