import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Batch } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const batchSchema = z.object({
  "Batch Name": z.string().min(2, "Batch Name is required"),
  Course: z.string().min(2, "Course Name is required"),
  Trainer: z.string().min(2, "Trainer Name is required"),
  "Start Date": z.string().min(1, "Start Date is required"),
  Status: z.enum(["Ongoing", "Completed", "Upcoming"]),
});

type BatchFormValues = z.infer<typeof batchSchema>;

interface BatchFormProps {
  initialData: Batch | null;
  onSave: (data: Partial<Batch>) => void;
}

export function BatchForm({ initialData, onSave }: BatchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      "Batch Name": initialData?.["Batch Name"] || "",
      Course: initialData?.Course || "",
      Trainer: initialData?.Trainer || "",
      "Start Date": initialData?.["Start Date"] || new Date().toISOString().split("T")[0],
      Status: initialData?.Status || "Ongoing",
    },
  });

  const onSubmit = async (data: BatchFormValues) => {
    setIsSubmitting(true);
    await onSave(data as Partial<Batch>);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="Batch Name">Batch Name</Label>
          <Input id="Batch Name" {...register("Batch Name")} placeholder="e.g. MERN Stack B1" />
          {errors["Batch Name"] && (
            <p className="text-sm text-red-500">{errors["Batch Name"].message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Course">Course</Label>
          <Input id="Course" {...register("Course")} placeholder="e.g. Full Stack Web Development" />
          {errors.Course && (
            <p className="text-sm text-red-500">{errors.Course.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Trainer">Trainer</Label>
          <Input id="Trainer" {...register("Trainer")} placeholder="e.g. John Doe" />
          {errors.Trainer && (
            <p className="text-sm text-red-500">{errors.Trainer.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Start Date">Start Date</Label>
          <Input id="Start Date" type="date" {...register("Start Date")} />
          {errors["Start Date"] && (
            <p className="text-sm text-red-500">{errors["Start Date"].message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Status">Status</Label>
          <select
            id="Status"
            {...register("Status")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          {errors.Status && (
            <p className="text-sm text-red-500">{errors.Status.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Batch"}
        </Button>
      </div>
    </form>
  );
}
