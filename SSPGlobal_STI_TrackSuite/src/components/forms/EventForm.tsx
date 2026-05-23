"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DailySchedule, EventType, ReminderTime, RecurrenceConfig, RecurrencePattern, defaultRecurrence } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_TYPES } from "@/constants";
import { useNotificationStore } from "@/stores/notificationStore";
import { Bell, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatRawDateToISTDate,
  formatRawTimeToISTTime,
  parseFormattedDate,
  parseFormattedTime,
  calculateDuration,
  determineAutoStatus,
  formatToISTDateTime,
} from "@/utils/dateUtils";

const REMINDER_OPTIONS: { value: ReminderTime; label: string }[] = [
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];

const baseSchema = z.object({
  "Event Type": z.string().min(1, "Event Type is required"),
  "Schedule Date": z.string().min(1, "Schedule Date is required"),
  "Start Time": z.string().min(1, "Start Time is required"),
  "End Time": z.string().optional(),
  Status: z.enum(["Scheduled", "Running", "Ongoing", "Completed", "Cancelled", "Holiday", "Postponed", "PAP"]),
  Notes: z.string().optional(),
  Title: z.string().optional(),
  Organizer: z.string().optional(),
  "Meeting Link": z.string().optional(),
  Participants: z.string().optional(),
  Location: z.string().optional(),
  Agenda: z.string().optional(),
});

type EventFormValues = z.infer<typeof baseSchema>;
type FormFieldKey = keyof EventFormValues;

interface EventFormProps {
  initialData: DailySchedule | null;
  onSave: (data: Partial<DailySchedule>) => void;
  onCancel?: () => void;
}

type EventFormField = {
  key: FormFieldKey;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
};

const EVENT_FIELDS: Record<EventType, EventFormField[]> = {
  "Training Session": [
    { key: "Title", label: "Session Topic", type: "text", placeholder: "e.g. Python Basics - Variables & Loops" },
    { key: "Organizer", label: "Trainer", type: "text", placeholder: "e.g. John Doe" },
  ],
  "Internal Meeting": [
    { key: "Title", label: "Meeting Title", type: "text", required: true, placeholder: "e.g. Weekly Staff Sync" },
    { key: "Organizer", label: "Organizer", type: "text", placeholder: "e.g. John Doe" },
    { key: "Participants", label: "Participants", type: "text", placeholder: "Email addresses or names" },
    { key: "Meeting Link", label: "Meeting Link", type: "text", placeholder: "e.g. https://meet.google.com/..." },
    { key: "Location", label: "Room / Location", type: "text", placeholder: "e.g. Conference Room A" },
  ],
  "Client Meeting": [
    { key: "Title", label: "Meeting Title", type: "text", required: true, placeholder: "e.g. ABC Corp - Project Review" },
    { key: "Organizer", label: "Account Manager", type: "text", placeholder: "e.g. Jane Smith" },
    { key: "Participants", label: "Attendees", type: "text", placeholder: "Client contacts, internal team" },
    { key: "Meeting Link", label: "Meeting Link", type: "text", placeholder: "e.g. https://zoom.us/j/..." },
    { key: "Agenda", label: "Agenda", type: "textarea", placeholder: "Topics to discuss..." },
  ],
  "Interview": [
    { key: "Title", label: "Position", type: "text", required: true, placeholder: "e.g. Frontend Developer Interview" },
    { key: "Organizer", label: "Interviewer", type: "text", placeholder: "e.g. Sarah Johnson" },
    { key: "Participants", label: "Candidate", type: "text", placeholder: "Candidate name" },
    { key: "Meeting Link", label: "Meeting Link", type: "text", placeholder: "e.g. https://meet.google.com/..." },
  ],
  "Workshop": [
    { key: "Title", label: "Workshop Title", type: "text", required: true, placeholder: "e.g. React Workshop - State Management" },
    { key: "Organizer", label: "Facilitator", type: "text", placeholder: "e.g. Mike Chen" },
    { key: "Participants", label: "Target Audience", type: "text", placeholder: "e.g. Batch A, Batch B" },
    { key: "Location", label: "Venue / Room", type: "text", placeholder: "e.g. Lab 3" },
  ],
  "Webinar": [
    { key: "Title", label: "Webinar Title", type: "text", required: true, placeholder: "e.g. Introduction to Machine Learning" },
    { key: "Organizer", label: "Speaker", type: "text", placeholder: "e.g. Dr. Alan Turing" },
    { key: "Meeting Link", label: "Webinar Link", type: "text", placeholder: "e.g. https://zoom.us/j/..." },
    { key: "Participants", label: "Expected Attendees", type: "text", placeholder: "e.g. 50 students" },
  ],
  "Team Sync": [
    { key: "Title", label: "Sync Title", type: "text", required: true, placeholder: "e.g. Daily Standup" },
    { key: "Participants", label: "Team Members", type: "text", placeholder: "e.g. Dev Team, QA Team" },
    { key: "Meeting Link", label: "Meeting Link", type: "text", placeholder: "e.g. https://meet.google.com/..." },
    { key: "Agenda", label: "Agenda", type: "textarea", placeholder: "Points to cover..." },
  ],
  "Demo Session": [
    { key: "Title", label: "Demo Title", type: "text", required: true, placeholder: "e.g. SSP Dashboard Demo" },
    { key: "Organizer", label: "Presenter", type: "text", placeholder: "e.g. Priya Sharma" },
    { key: "Participants", label: "Audience", type: "text", placeholder: "e.g. Client Team, Stakeholders" },
    { key: "Meeting Link", label: "Demo Link", type: "text", placeholder: "e.g. https://meet.google.com/..." },
  ],
  "Custom Event": [
    { key: "Title", label: "Event Title", type: "text", required: true, placeholder: "e.g. Team Outing" },
    { key: "Organizer", label: "Organizer", type: "text", placeholder: "Who is organizing this?" },
    { key: "Location", label: "Location", type: "text", placeholder: "e.g. Office, Online, etc." },
    { key: "Agenda", label: "Description", type: "textarea", placeholder: "Event description..." },
  ],
};

export function EventForm({ initialData, onSave, onCancel }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<ReminderTime[]>(() => {
    if (initialData?.Reminders) {
      return String(initialData.Reminders).split(",").map(Number).filter((n) => !isNaN(n)) as ReminderTime[];
    }
    return [15];
  });
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(() => {
    if (initialData?.Recurrence) {
      try { return JSON.parse(initialData.Recurrence); } catch { return defaultRecurrence(); }
    }
    return defaultRecurrence();
  });
  const [recurrenceEndCount, setRecurrenceEndCount] = useState(4);
  const { requestPermission } = useNotificationStore();

  const defaultEventType: EventType = initialData?.["Event Type"] || "Training Session";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      "Event Type": defaultEventType,
      "Schedule Date": initialData?.["Schedule Date"] ? parseFormattedDate(initialData["Schedule Date"]) : new Date().toISOString().split("T")[0],
      "Start Time": initialData?.["Start Time"] ? parseFormattedTime(initialData["Start Time"]) : "",
      "End Time": initialData?.["End Time"] ? parseFormattedTime(initialData["End Time"]) : "",
      Status: initialData?.Status || "Scheduled",
      Notes: initialData?.Notes || "",
      Title: initialData?.Title || "",
      Organizer: initialData?.Organizer || "",
      "Meeting Link": initialData?.["Meeting Link"] || "",
      Participants: initialData?.Participants || "",
      Location: initialData?.Location || "",
      Agenda: initialData?.Agenda || "",
    },
  });

  const watchedStatus = watch("Status");
  const watchedStartTime = watch("Start Time");
  const watchedEndTime = watch("End Time");
  const watchedScheduleDate = watch("Schedule Date");
  const watchedEventType = watch("Event Type");
  const currentFields = EVENT_FIELDS[watchedEventType as EventType] || [];

  useEffect(() => {
    if (watchedStatus === "Completed" && !watchedEndTime) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setValue("End Time", `${hours}:${minutes}`);
    }
  }, [watchedStatus, watchedEndTime, setValue]);

  const toggleReminder = (time: ReminderTime) => {
    setSelectedReminders((prev) =>
      prev.includes(time) ? prev.filter((r) => r !== time) : [...prev, time].sort((a, b) => a - b)
    );
  };

  const formattedDate = formatRawDateToISTDate(watchedScheduleDate);
  const formattedStartTime = formatRawTimeToISTTime(watchedStartTime);
  const formattedEndTime = formatRawTimeToISTTime(watchedEndTime || "");
  const duration = calculateDuration(watchedStartTime, watchedEndTime || "");
  const autoStatus = determineAutoStatus(formattedDate, formattedStartTime, formattedEndTime, watchedStatus);

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    requestPermission();

    const formattedDateVal = formatRawDateToISTDate(data["Schedule Date"]);
    const formattedStartVal = formatRawTimeToISTTime(data["Start Time"]);
    const formattedEndVal = formatRawTimeToISTTime(data["End Time"] || "");
    const durationVal = calculateDuration(data["Start Time"], data["End Time"] || "");
    const finalStatus = determineAutoStatus(formattedDateVal, formattedStartVal, formattedEndVal, data.Status);
    const nowIST = formatToISTDateTime(new Date());

    const payload: Partial<DailySchedule> = {
      "Event Type": data["Event Type"] as EventType,
      "Batch Name": initialData?.["Batch Name"] || "",
      "Schedule Date": formattedDateVal,
      "Start Time": formattedStartVal,
      "End Time": formattedEndVal,
      Status: finalStatus,
      Duration: durationVal,
      Notes: data.Notes || "",
      Title: data.Title || "",
      Organizer: data.Organizer || "",
      "Meeting Link": data["Meeting Link"] || "",
      Participants: data.Participants || "",
      Location: data.Location || "",
      Agenda: data.Agenda || "",
      Reminders: selectedReminders.join(","),
      Recurrence: JSON.stringify(recurrence),
      "Last Updated Timestamp (IST)": nowIST,
    };

    if (!initialData) {
      payload["Created Time (IST)"] = nowIST;
      payload["Modified Time (IST)"] = nowIST;
      payload["Last Status Change Time (IST)"] = nowIST;
    } else {
      payload["Created Time (IST)"] = initialData["Created Time (IST)"] || nowIST;
      payload["Modified Time (IST)"] = nowIST;
      payload["Last Status Change Time (IST)"] =
        initialData.Status !== finalStatus
          ? nowIST
          : initialData["Last Status Change Time (IST)"] || nowIST;
    }

    await onSave(payload);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="Event Type">Event Type</Label>
        <select
          id="Event Type"
          {...register("Event Type")}
          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {EVENT_TYPES.map((et) => (
            <option key={et.value} value={et.value}>{et.label}</option>
          ))}
        </select>
      </div>

      {currentFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {field.type === "textarea" ? (
            <Textarea id={field.key} {...register(field.key)} placeholder={field.placeholder} rows={3} />
          ) : (
            <Input id={field.key} type="text" {...register(field.key)} placeholder={field.placeholder} />
          )}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Schedule Date">Date</Label>
          <Input id="Schedule Date" type="date" {...register("Schedule Date")} />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Start Time">Start Time</Label>
          <Input id="Start Time" type="time" {...register("Start Time")} />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="End Time">End Time</Label>
          <Input id="End Time" type="time" {...register("End Time")} />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="Status">Status</Label>
          <select
            id="Status"
            {...register("Status")}
            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Scheduled">Scheduled (Auto)</option>
            <option value="Running">Running (Auto)</option>
            <option value="Ongoing">Ongoing (Auto)</option>
            <option value="Completed">Completed (Auto)</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Postponed">Postponed</option>
          </select>
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label>Auto Status</Label>
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-sm">Recurrence</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["none", "daily", "weekdays", "weekly", "biweekly", "monthly"] as RecurrencePattern[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRecurrence((prev) => ({ ...prev, pattern: p }))}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors capitalize",
                recurrence.pattern === p
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "none" ? "No repeat" : p}
            </button>
          ))}
        </div>
        {recurrence.pattern !== "none" && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground">End after</span>
            <Input
              type="number"
              min={1}
              max={52}
              value={recurrenceEndCount}
              onChange={(e) => setRecurrenceEndCount(Number(e.target.value))}
              className="h-7 w-16 text-xs"
            />
            <span className="text-[10px] text-muted-foreground">occurrences</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-sm">Reminders</Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleReminder(opt.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors",
                selectedReminders.includes(opt.value)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {selectedReminders.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {selectedReminders.length} reminder{selectedReminders.length > 1 ? "s" : ""} set
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="Notes">Notes</Label>
        <Textarea id="Notes" {...register("Notes")} placeholder="Additional notes..." rows={2} />
      </div>

      <div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {formattedDate && <p>Date: <span className="font-medium text-foreground">{formattedDate}</span></p>}
          {formattedStartTime && (
            <p>Time: <span className="font-medium text-foreground">{formattedStartTime}{formattedEndTime ? ` - ${formattedEndTime}` : " onwards"}</span></p>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}

