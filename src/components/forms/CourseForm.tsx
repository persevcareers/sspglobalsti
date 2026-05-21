import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const courseSchema = z.object({
  "Course Name": z.string().min(2, "Course Name is required"),
  Modules: z.string().min(2, "Modules are required"),
  Duration: z.string().min(2, "Duration is required"),
  Status: z.enum(["Active", "Inactive"]),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  initialData: Course | null;
  onSave: (data: Partial<Course>) => void;
}

export function CourseForm({ initialData, onSave }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      "Course Name": initialData?.["Course Name"] || "",
      Modules: initialData?.Modules || "",
      Duration: initialData?.Duration || "",
      Status: initialData?.Status || "Active",
    },
  });

  const onSubmit = async (data: CourseFormValues) => {
    setIsSubmitting(true);
    await onSave(data as Partial<Course>);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="Course Name">Course Name</Label>
          <Input id="Course Name" {...register("Course Name")} />
          {errors["Course Name"] && (
            <p className="text-sm text-red-500">{errors["Course Name"].message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Modules">Modules (comma separated)</Label>
          <Input id="Modules" {...register("Modules")} placeholder="e.g. HTML, CSS, JavaScript" />
          {errors.Modules && (
            <p className="text-sm text-red-500">{errors.Modules.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Duration">Duration</Label>
          <Input id="Duration" {...register("Duration")} placeholder="e.g. 4 Weeks, 3 Months" />
          {errors.Duration && (
            <p className="text-sm text-red-500">{errors.Duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Status">Status</Label>
          <select
            id="Status"
            {...register("Status")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Course"}
        </Button>
      </div>
    </form>
  );
}
