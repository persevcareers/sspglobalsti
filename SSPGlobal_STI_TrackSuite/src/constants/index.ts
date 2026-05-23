export const SHEET_NAMES = {
  STUDENTS: "Students",
  COURSES: "Courses",
  SCHEDULES: "DailySchedules",
  LEADS: "Leads",
  TRAINERS: "Trainers",
  ANALYTICS: "Analytics",
  BATCHES: "Batches",
  USERS: "Users",
  LOGIN_LOGS: "LoginLogs",
  SESSION_LOGS: "SessionLogs",
  ROLES: "Roles",
} as const;

export const LEAD_SOURCES = [
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
] as const;

export const STUDENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;

export const COMPLETION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
] as const;

export const COURSE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
] as const;

export const TRAINER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export const ROLES = [
  { value: "Super Admin", label: "Super Admin" },
  { value: "Admin", label: "Admin" },
  { value: "Trainer", label: "Trainer" },
  { value: "Student", label: "Student" },
  { value: "HR", label: "HR" },
  { value: "Staff", label: "Staff" },
] as const;

export const USER_STATUSES = [
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
  { value: "Idle", label: "Idle" },
  { value: "Suspended", label: "Suspended" },
] as const;

export const ACTIVITY_TIMEOUT_MINUTES = 15;
export const HEARTBEAT_INTERVAL_MS = 120000;
export const NOTIFICATION_POLL_INTERVAL_MS = 10000;

export const NOTIFICATION_CATEGORIES = [
  "security",
  "attendance",
  "system",
  "schedule",
  "batch",
  "lead",
  "student",
  "payment",
  "info"
] as const;

export const NOTIFICATION_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const NOTIFICATION_STATUSES = ["unread", "read", "archived", "deleted"] as const;

export const NOTIFICATION_SOURCES = [
  "security",
  "attendance",
  "system",
  "schedule",
  "batch",
  "lead",
  "student",
  "payment",
  "info"
] as const;

export const NOTIFICATION_DEDUP_WINDOW_MS = 300000;
export const NOTIFICATION_FETCH_LIMIT = 50;

export const EVENT_TYPES = [
  { value: "Training Session", label: "Training Session", icon: "GraduationCap" },
  { value: "Internal Meeting", label: "Internal Meeting", icon: "Users" },
  { value: "Client Meeting", label: "Client Meeting", icon: "Handshake" },
  { value: "Interview", label: "Interview", icon: "UserCheck" },
  { value: "Workshop", label: "Workshop", icon: "Wrench" },
  { value: "Webinar", label: "Webinar", icon: "Monitor" },
  { value: "Team Sync", label: "Team Sync", icon: "MessageCircle" },
  { value: "Demo Session", label: "Demo Session", icon: "Play" },
  { value: "Custom Event", label: "Custom Event", icon: "Calendar" },
] as const;

export const EVENT_TYPE_COLORS: Record<string, string> = {
  "Training Session": "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
  "Internal Meeting": "from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400",
  "Client Meeting": "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
  "Interview": "from-purple-500/10 to-violet-500/10 text-purple-600 dark:text-purple-400",
  "Workshop": "from-pink-500/10 to-rose-500/10 text-pink-600 dark:text-pink-400",
  "Webinar": "from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400",
  "Team Sync": "from-cyan-500/10 to-sky-500/10 text-cyan-600 dark:text-cyan-400",
  "Demo Session": "from-orange-500/10 to-amber-500/10 text-orange-600 dark:text-orange-400",
  "Custom Event": "from-gray-500/10 to-slate-500/10 text-gray-600 dark:text-gray-400",
};

