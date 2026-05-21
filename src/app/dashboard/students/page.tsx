"use client";

import { useState } from "react";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student } from "@/types";
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
import { StudentForm } from "@/components/forms/StudentForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function StudentsPage() {
  const { data: students, isLoading, createRecord, updateRecord, deleteRecord } = useSheetsData<Student>("Students");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(
    (student) =>
      student["Full Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student["Email"]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (studentData: Partial<Student>) => {
    let success = false;
    if (editingStudent) {
      success = await updateRecord({ ...studentData, "Student ID": editingStudent["Student ID"] });
    } else {
      success = await createRecord(studentData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingStudent(null);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleDelete = async (student: Student) => {
    if (confirm(`Are you sure you want to delete ${student["Full Name"]}?`)) {
      await deleteRecord({ "Student ID": student["Student ID"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingStudent(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <StudentForm initialData={editingStudent} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
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
              <TableHead>Course</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
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
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student, index) => (
                <TableRow key={student["Student ID"] || index}>
                  <TableCell className="font-medium">{student["Full Name"]}</TableCell>
                  <TableCell>{student["Email"]}</TableCell>
                  <TableCell>{student["Course"]}</TableCell>
                  <TableCell>{student["Batch"]}</TableCell>
                  <TableCell>{student["Status"]}</TableCell>
                  <TableCell>{student["Progress Percentage"]}%</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(student)}>Delete</Button>
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
