import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lead } from "@/types";
import { getISTDateOnly } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const leadSchema = z.object({
  "Lead Name": z.string().min(2, "Lead Name is required"),
  Contact: z.string().min(2, "Contact info is required"),
  Source: z.enum(["Instagram", "LinkedIn", "YouTube", "WhatsApp", "Website", "Referral"]),
  "Interested Course": z.string().min(2, "Interested Course is required"),
  Status: z.enum(["New", "Contacted", "Converted", "Lost"]),
  "Follow-up Date": z.string().min(1, "Follow-up date is required"),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormProps {
  initialData: Lead | null;
  onSave: (data: Partial<Lead>) => void;
}

export function LeadForm({ initialData, onSave }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      "Lead Name": initialData?.["Lead Name"] || "",
      Contact: initialData?.Contact || "",
      Source: initialData?.Source || "Website",
      "Interested Course": initialData?.["Interested Course"] || "",
      Status: initialData?.Status || "New",
      "Follow-up Date": initialData?.["Follow-up Date"] || getISTDateOnly(),
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    await onSave(data as Partial<Lead>);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Lead Name">Lead Name</Label>
          <Input id="Lead Name" {...register("Lead Name")} />
          {errors["Lead Name"] && (
            <p className="text-sm text-red-500">{errors["Lead Name"].message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Contact">Contact (Email/Phone)</Label>
          <Input id="Contact" {...register("Contact")} placeholder="e.g. email@example.com" />
          {errors.Contact && (
            <p className="text-sm text-red-500">{errors.Contact.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Source">Source</Label>
          <select
            id="Source"
            {...register("Source")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Instagram">Instagram</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Interested Course">Interested Course</Label>
          <Input id="Interested Course" {...register("Interested Course")} />
          {errors["Interested Course"] && (
            <p className="text-sm text-red-500">{errors["Interested Course"].message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="Status">Status</Label>
          <select
            id="Status"
            {...register("Status")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="Follow-up Date">Follow-up Date</Label>
          <Input id="Follow-up Date" type="date" {...register("Follow-up Date")} />
          {errors["Follow-up Date"] && (
            <p className="text-sm text-red-500">{errors["Follow-up Date"].message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Lead"}
        </Button>
      </div>
    </form>
  );
}
