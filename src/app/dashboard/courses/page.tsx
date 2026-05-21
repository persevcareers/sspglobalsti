"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Course } from "@/types";
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
import { Plus, Search } from "lucide-react";
import { CourseForm } from "@/components/forms/CourseForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { fadeIn, tableRowVariants } from "@/lib/animations";

export default function CoursesPage() {
  const { data: courses, isLoading, createRecord, updateRecord, deleteRecord } = useSheetsData<Course>("Courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const filteredCourses = courses.filter(
    (course) =>
      course["Course Name"]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (courseData: Partial<Course>) => {
    let success = false;
    if (editingCourse) {
      success = await updateRecord({ ...courseData, "Course ID": editingCourse["Course ID"] });
    } else {
      success = await createRecord(courseData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingCourse(null);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (confirm(`Are you sure you want to delete course ${course["Course Name"]}?`)) {
      await deleteRecord({ "Course ID": course["Course ID"] });
    }
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCourse(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
            </DialogHeader>
            <CourseForm initialData={editingCourse} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <TableSkeleton rows={4} />
                </TableCell>
              </TableRow>
            ) : filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No courses found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course, index) => (
                <motion.tr
                  key={course["Course ID"] || index}
                  custom={index}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{course["Course Name"]}</TableCell>
                  <TableCell>{course["Modules"]}</TableCell>
                  <TableCell>{course["Duration"]}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${course.Status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {course["Status"]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(course)}>Delete</Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
