import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DailySchedule } from "@/types";
import { getISTDateOnly } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRawDateToISTDate,
  formatRawTimeToISTTime,
  parseFormattedDate,
  parseFormattedTime,
  calculateDuration,
  determineAutoStatus,
  formatToISTDateTime,
} from "@/utils/dateUtils";

const scheduleSchema = z.object({
  "Batch Name": z.string().min(1, "Batch Name is required"),
  "Schedule Date": z.string().min(1, "Schedule Date is required"),
  "Start Time": z.string().min(1, "Start Time is required"),
  "End Time": z.string().optional(),
  Status: z.enum(["Scheduled", "Running", "Completed", "Cancelled", "Holiday", "Postponed", "PAP"]),
  Notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
  initialData: DailySchedule | null;
  onSave: (data: Partial<DailySchedule>) => void;
}

export function ScheduleForm({ initialData, onSave }: ScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      "Batch Name": initialData?.["Batch Name"] || "",
      "Schedule Date": initialData?.["Schedule Date"] ? parseFormattedDate(initialData["Schedule Date"]) : getISTDateOnly(),
      "Start Time": initialData?.["Start Time"] ? parseFormattedTime(initialData["Start Time"]) : "",
      "End Time": initialData?.["End Time"] ? parseFormattedTime(initialData["End Time"]) : "",
      Status: initialData?.Status || "Scheduled",
      Notes: initialData?.Notes || "",
    },
  });

  const watchedStatus = watch("Status");
  const watchedStartTime = watch("Start Time");
  const watchedEndTime = watch("End Time");
  const watchedScheduleDate = watch("Schedule Date");

  // Automatically fill End Time with current time when status is marked Completed and End Time is blank
  useEffect(() => {
    if (watchedStatus === "Completed" && !watchedEndTime) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setValue("End Time", `${hours}:${minutes}`);
    }
  }, [watchedStatus, watchedEndTime, setValue]);

  // Live calculations for display in form
  const formattedDate = formatRawDateToISTDate(watchedScheduleDate);
  const formattedStartTime = formatRawTimeToISTTime(watchedStartTime);
  const formattedEndTime = formatRawTimeToISTTime(watchedEndTime || "");
  const duration = calculateDuration(watchedStartTime, watchedEndTime || "");
  
  // Real-time auto status calculation
  const autoStatus = determineAutoStatus(formattedDate, formattedStartTime, formattedEndTime, watchedStatus);

  const onSubmit = async (data: ScheduleFormValues) => {
    setIsSubmitting(true);
    
    const formattedDateVal = formatRawDateToISTDate(data["Schedule Date"]);
    const formattedStartVal = formatRawTimeToISTTime(data["Start Time"]);
    const formattedEndVal = formatRawTimeToISTTime(data["End Time"] || "");
    const durationVal = calculateDuration(data["Start Time"], data["End Time"] || "");
    
    // Auto status checks and manual overrides
    const finalStatus = determineAutoStatus(formattedDateVal, formattedStartVal, formattedEndVal, data.Status);
    const nowIST = formatToISTDateTime(new Date());

    const payload: Partial<DailySchedule> = {
      "Batch Name": data["Batch Name"],
      "Schedule Date": formattedDateVal,
      "Start Time": formattedStartVal,
      "End Time": formattedEndVal,
      Status: finalStatus,
      Duration: durationVal,
      Notes: data.Notes || "",
      "Last Updated Timestamp (IST)": nowIST,
    };

    if (!initialData) {
      // New record
      payload["Created Time (IST)"] = nowIST;
      payload["Modified Time (IST)"] = nowIST;
      payload["Last Status Change Time (IST)"] = nowIST;
    } else {
      // Edit record
      payload["Created Time (IST)"] = initialData["Created Time (IST)"] || nowIST;
      payload["Modified Time (IST)"] = nowIST;
      
      // Update Status Change Time if status changed
      if (initialData.Status !== finalStatus) {
        payload["Last Status Change Time (IST)"] = nowIST;
      } else {
        payload["Last Status Change Time (IST)"] = initialData["Last Status Change Time (IST)"] || nowIST;
      }
    }

    await onSave(payload);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Batch Name">Batch Name</Label>
          <Input id="Batch Name" {...register("Batch Name")} placeholder="e.g. Python Batch A" />
          {errors["Batch Name"] && (
            <p className="text-xs text-destructive">{errors["Batch Name"].message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Schedule Date">Schedule Date</Label>
          <Input id="Schedule Date" type="date" {...register("Schedule Date")} />
          {errors["Schedule Date"] && (
            <p className="text-xs text-destructive">{errors["Schedule Date"].message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Start Time">Start Time</Label>
          <Input id="Start Time" type="time" {...register("Start Time")} />
          {errors["Start Time"] && (
            <p className="text-xs text-destructive">{errors["Start Time"].message}</p>
          )}
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="End Time">End Time</Label>
          <Input id="End Time" type="time" {...register("End Time")} />
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Status">Status Selection</Label>
          <select
            id="Status"
            {...register("Status")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Scheduled">Scheduled (Auto)</option>
            <option value="Running">Running (Auto)</option>
            <option value="Completed">Completed (Auto)</option>
            <option value="Cancelled">Cancelled (Manual)</option>
            <option value="Holiday">Holiday (Manual)</option>
            <option value="Postponed">Postponed (Manual)</option>
            <option value="PAP">PAP (Placement Assistance Program)</option>
          </select>
        </div>

        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label>Calculated Status</Label>
          <div className="flex items-center h-9 px-3 rounded-md border border-dashed bg-muted/30 text-sm font-semibold">
            {autoStatus}
          </div>
        </div>

        {duration && (
          <div className="space-y-2 col-span-2">
            <Label>Duration</Label>
            <div className="flex items-center h-9 px-3 rounded-md border border-dashed bg-muted/30 text-sm">
              {duration}
            </div>
          </div>
        )}

        <div className="space-y-2 col-span-2">
          <Label htmlFor="Notes">Notes</Label>
          <Textarea
            id="Notes"
            {...register("Notes")}
            placeholder="Add schedule instructions, topic details, or checklist notes..."
            rows={3}
          />
        </div>
      </div>

      <div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {formattedDate && (
            <p>
              Schedule Date: <span className="font-medium text-foreground">{formattedDate}</span>
            </p>
          )}
          {formattedStartTime && (
            <p>
              Time:{" "}
              <span className="font-medium text-foreground">
                {formattedStartTime}
                {formattedEndTime ? ` - ${formattedEndTime}` : " onwards"}
              </span>
            </p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Schedule"}
        </Button>
      </div>
    </form>
  );
}
