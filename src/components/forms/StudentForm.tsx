import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Student } from "@/types";
import { getISTDateOnly } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const studentSchema = z.object({
  "Full Name": z.string().min(2, "Name is required"),
  Email: z.string().email("Invalid email address"),
  "Phone Number": z.string().min(10, "Valid phone number required"),
  Course: z.string().min(2, "Course is required"),
  Batch: z.string().min(2, "Batch is required"),
  "Start Date": z.string().min(1, "Start Date is required"),
  "End Date": z.string().optional(),
  Status: z.enum(["Active", "Completed", "Dropped", "On Hold"]),
  "Progress Percentage": z.number().min(0).max(100),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  initialData: Student | null;
  onSave: (data: Partial<Student>) => void;
}

export function StudentForm({ initialData, onSave }: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      "Full Name": initialData?.["Full Name"] || "",
      Email: initialData?.Email || "",
      "Phone Number": initialData?.["Phone Number"] || "",
      Course: initialData?.Course || "",
      Batch: initialData?.Batch || "",
      "Start Date": initialData?.["Start Date"] || getISTDateOnly(),
      "End Date": initialData?.["End Date"] || "",
      Status: initialData?.Status || "Active",
      "Progress Percentage": Number(initialData?.["Progress Percentage"] || 0),
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    await onSave(data as Partial<Student>);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Full Name">Full Name</Label>
          <Input id="Full Name" {...register("Full Name")} />
          {errors["Full Name"] && <p className="text-sm text-red-500">{errors["Full Name"].message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="Email">Email</Label>
          <Input id="Email" type="email" {...register("Email")} />
          {errors.Email && <p className="text-sm text-red-500">{errors.Email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Phone Number">Phone Number</Label>
          <Input id="Phone Number" {...register("Phone Number")} />
          {errors["Phone Number"] && <p className="text-sm text-red-500">{errors["Phone Number"].message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Course">Course</Label>
          <Input id="Course" {...register("Course")} />
          {errors.Course && <p className="text-sm text-red-500">{errors.Course.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Batch">Batch</Label>
          <Input id="Batch" {...register("Batch")} />
          {errors.Batch && <p className="text-sm text-red-500">{errors.Batch.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Progress Percentage">Progress (%)</Label>
          <Input id="Progress Percentage" type="number" {...register("Progress Percentage", { valueAsNumber: true })} />
          {errors["Progress Percentage"] && <p className="text-sm text-red-500">{errors["Progress Percentage"].message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Start Date">Start Date</Label>
          <Input id="Start Date" type="date" {...register("Start Date")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="Status">Status</Label>
          <select 
            id="Status" 
            {...register("Status")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
          >
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Student"}
        </Button>
      </div>
    </form>
  );
}
