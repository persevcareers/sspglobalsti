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

export const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/dashboard/students", label: "Students", icon: "Users" },
  { href: "/dashboard/courses", label: "Courses", icon: "BookOpen" },
  { href: "/dashboard/schedules", label: "Schedules", icon: "Calendar" },
  { href: "/dashboard/leads", label: "Leads", icon: "Target" },
  { href: "/dashboard/trainers", label: "Trainers", icon: "GraduationCap" },
  { href: "/dashboard/batches", label: "Batches", icon: "Layers" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
] as const;

export const ITEMS_PER_PAGE = 10;

export const ACTIVITY_TIMEOUT_MINUTES = 15;
export const HEARTBEAT_INTERVAL_MS = 120000;
export const NOTIFICATION_POLL_INTERVAL_MS = 10000;
