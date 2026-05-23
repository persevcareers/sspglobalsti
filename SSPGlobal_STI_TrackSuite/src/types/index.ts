export interface BaseEntity {
  "Created At"?: string;
}

export interface Student extends BaseEntity {
  "Student ID": string;
  "Full Name": string;
  Email: string;
  "Phone Number": string;
  Course: string;
  Batch: string;
  "Start Date": string;
  "End Date": string;
  Status: "Active" | "Completed" | "Dropped" | "On Hold";
  "Progress Percentage": number | string;
}

export interface Course extends BaseEntity {
  "Course ID": string;
  "Course Name": string;
  Modules: string;
  Duration: string;
  Status: "Active" | "Inactive";
}

export type EventType =
  | "Training Session"
  | "Internal Meeting"
  | "Client Meeting"
  | "Interview"
  | "Workshop"
  | "Webinar"
  | "Team Sync"
  | "Demo Session"
  | "Custom Event";

export type EventStatusV2 = "Scheduled" | "Running" | "Ongoing" | "Completed" | "Cancelled" | "Postponed" | "Holiday" | "PAP";

export interface AppEvent extends BaseEntity {
  "Task ID": string;
  "Event Type": EventType;
  "Title": string;
  "Schedule Date": string;
  "Start Time": string;
  "End Time": string;
  "Status": EventStatusV2;
  "Duration": string;
  "Organizer": string;
  "Meeting Link": string;
  "Participants": string;
  "Location": string;
  "Agenda": string;
  "Notes": string;
  "Last Updated Timestamp (IST)": string;
  "Batch Name": string;
  "Reminders": string;
  "Recurrence": string;
  "Created Time (IST)"?: string;
  "Modified Time (IST)"?: string;
  "Last Status Change Time (IST)"?: string;
}

export type DailySchedule = AppEvent;

export type ReminderTime = 5 | 15 | 30 | 60 | 1440;

export type RecurrencePattern = "none" | "daily" | "weekdays" | "weekly" | "biweekly" | "monthly" | "custom";

export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval?: number;
  endAfter?: number;
  endDate?: string;
  daysOfWeek?: number[];
}

export function defaultRecurrence(): RecurrenceConfig {
  return { pattern: "none" };
}

export interface ActivityLogEntry {
  "Log ID": string;
  "Event ID": string;
  "Action": string;
  "Details": string;
  "Timestamp (IST)": string;
  "Event Title": string;
  "Event Type": EventType;
}

export interface EventNotification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  type: "reminder" | "status_change" | "event_created" | "event_updated" | "event_cancelled" | "event_rescheduled" | "overdue" | "info";
  priority: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  createdAt: string;
  eventTitle: string;
}

export interface Lead extends BaseEntity {
  "Lead ID": string;
  "Lead Name": string;
  Contact: string;
  Source: "Instagram" | "LinkedIn" | "YouTube" | "WhatsApp" | "Website" | "Referral";
  "Interested Course": string;
  Status: "New" | "Contacted" | "Converted" | "Lost";
  "Follow-up Date": string;
}

export interface Trainer extends BaseEntity {
  "Trainer ID": string;
  Name: string;
  Email: string;
  Phone: string;
  Specialization: string;
  Status: "Active" | "Inactive";
}

export interface Batch extends BaseEntity {
  "Batch ID": string;
  "Batch Name": string;
  Course: string;
  Trainer: string;
  "Start Date": string;
  Status: "Ongoing" | "Completed" | "Upcoming";
}

export type UserRole = "Super Admin" | "Admin" | "Trainer" | "Student" | "HR" | "Staff" | "Pending";
export type UserStatus = "Online" | "Offline" | "Idle" | "Suspended";

export interface User extends BaseEntity {
  "User ID": string;
  "Full Name": string;
  Email: string;
  Role: UserRole;
  "Login Time"?: string;
  "Logout Time"?: string;
  "Last Active"?: string;
  Status?: UserStatus;
}

export interface LoginLog {
  "Log ID"?: string;
  "User ID": string;
  Email: string;
  Name: string;
  Action: "Signup" | "Login" | "Logout";
  "Timestamp (IST)": string;
}

export interface SessionLog {
  "Log ID"?: string;
  "User ID": string;
  Email: string;
  "Login Time": string;
  "Logout Time"?: string;
  Duration?: string;
  Device?: string;
  Browser?: string;
  IP?: string;
}

export interface Role {
  "Role Name": string;
  Permissions: string;
}

export const ROLES_HIERARCHY: Record<UserRole, number> = {
  "Super Admin": 100,
  "Admin": 80,
  "Trainer": 60,
  "HR": 50,
  "Staff": 30,
  "Student": 20,
  "Pending": 0,
};

export const ROLES_LIST: UserRole[] = [
  "Super Admin",
  "Admin",
  "Trainer",
  "Student",
  "HR",
  "Staff",
];

export interface AppNotification {
  notificationId: string;
  organizationId?: string;
  branchId?: string;
  userId: string;
  actorId?: string;
  sourceModule: "security" | "attendance" | "system" | "schedule" | "batch" | "lead" | "student" | "payment" | "info";
  category: "security" | "attendance" | "system" | "schedule" | "batch" | "lead" | "student" | "payment" | "info" | "welcome" | "session" | "course" | "trainer";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  actionUrl?: string;
  actionType?: "link" | "modal" | "sheet";
  metadata?: string;
  status: "unread" | "read" | "archived" | "deleted";
  isDeleted: "TRUE" | "FALSE";
  createdAt: string;
  expiresAt?: string;
  deviceInfo?: string;
  sessionId?: string;
}

