import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trainer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const trainerSchema = z.object({
  Name: z.string().min(2, "Trainer Name is required"),
  Email: z.string().email("Invalid email address"),
  Phone: z.string().min(6, "Phone number is required"),
  Specialization: z.string().min(2, "Specialization is required"),
  Status: z.enum(["Active", "Inactive"]),
});

type TrainerFormValues = z.infer<typeof trainerSchema>;

interface TrainerFormProps {
  initialData: Trainer | null;
  onSave: (data: Partial<Trainer>) => void;
}

export function TrainerForm({ initialData, onSave }: TrainerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      Name: initialData?.Name || "",
      Email: initialData?.Email || "",
      Phone: initialData?.Phone || "",
      Specialization: initialData?.Specialization || "",
      Status: initialData?.Status || "Active",
    },
  });

  const onSubmit = async (data: TrainerFormValues) => {
    setIsSubmitting(true);
    await onSave(data as Partial<Trainer>);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="Name">Trainer Name</Label>
          <Input id="Name" {...register("Name")} />
          {errors.Name && (
            <p className="text-sm text-red-500">{errors.Name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Email">Email Address</Label>
          <Input id="Email" type="email" {...register("Email")} />
          {errors.Email && (
            <p className="text-sm text-red-500">{errors.Email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Phone">Phone Number</Label>
          <Input id="Phone" {...register("Phone")} />
          {errors.Phone && (
            <p className="text-sm text-red-500">{errors.Phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Specialization">Specialization</Label>
          <Input id="Specialization" {...register("Specialization")} placeholder="e.g. Next.js, Python, UI/UX" />
          {errors.Specialization && (
            <p className="text-sm text-red-500">{errors.Specialization.message}</p>
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
          {isSubmitting ? "Saving..." : "Save Trainer"}
        </Button>
      </div>
    </form>
  );
}
