import { auth, currentUser } from "@clerk/nextjs/server";
import { ROLES_HIERARCHY, type UserRole } from "@/types";

export async function getUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  return (user?.publicMetadata?.role as UserRole) ?? null;
}

export async function getUserId(): Promise<string | null> {
  const user = await currentUser();
  return user?.id ?? null;
}

export function hasAdminAccess(role: UserRole | null): boolean {
  if (!role) return false;
  const level = ROLES_HIERARCHY[role] ?? 0;
  return level >= 60;
}

export function isSuperAdmin(role: UserRole | null): boolean {
  return role === "Super Admin";
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "Admin" || role === "Super Admin";
}

export async function isTrainer(): Promise<boolean> {
  const role = await getUserRole();
  return role === "Trainer" || role === "Admin" || role === "Super Admin";
}

export async function isStudent(): Promise<boolean> {
  const role = await getUserRole();
  return role === "Student";
}

export function canAccess(role: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function roleHasAccess(userRole: UserRole | null, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  const userLevel = ROLES_HIERARCHY[userRole] ?? 0;
  const minLevel = ROLES_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= minLevel;
}

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/dashboard": ["Super Admin", "Admin", "Trainer", "Student", "HR", "Staff"],
  "/dashboard/students": ["Super Admin", "Admin", "Trainer", "HR", "Staff"],
  "/dashboard/courses": ["Super Admin", "Admin", "Trainer", "Student"],
  "/dashboard/schedules": ["Super Admin", "Admin", "Trainer", "Student", "HR", "Staff"],
  "/dashboard/leads": ["Super Admin", "Admin", "HR"],
  "/dashboard/trainers": ["Super Admin", "Admin"],
  "/dashboard/batches": ["Super Admin", "Admin", "Trainer"],
  "/dashboard/analytics": ["Super Admin", "Admin"],
  "/dashboard/settings": ["Super Admin", "Admin", "Trainer", "Student", "HR", "Staff"],
};

export function getAllowedRoutes(role: UserRole | null): string[] {
  if (!role) return ["/dashboard/settings"];
  if (role === "Super Admin") return Object.keys(ROUTE_PERMISSIONS);

  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([_, allowedRoles]) => allowedRoles.includes(role))
    .map(([route]) => route);
}
