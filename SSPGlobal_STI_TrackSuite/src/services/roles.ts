import { callSessionAction } from "./api";

export interface RolePermission {
  roleName: string;
  permissions: string[];
}

const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
  "/dashboard": ["VIEW_DASHBOARD"],
  "/dashboard/students": ["VIEW_STUDENTS", "MANAGE_STUDENTS"],
  "/dashboard/courses": ["VIEW_COURSES", "MANAGE_COURSES"],
  "/dashboard/schedules": ["VIEW_SCHEDULES", "MANAGE_SCHEDULES"],
  "/dashboard/leads": ["VIEW_LEADS", "MANAGE_LEADS"],
  "/dashboard/trainers": ["VIEW_TRAINERS", "MANAGE_TRAINERS"],
  "/dashboard/batches": ["VIEW_BATCHES", "MANAGE_BATCHES"],
  "/dashboard/analytics": ["VIEW_ANALYTICS"],
  "/dashboard/settings": ["VIEW_SETTINGS", "MANAGE_USERS", "MANAGE_ROLES"],
  "/dashboard/calendar": ["VIEW_SCHEDULES"],
};

export async function fetchRoles(): Promise<RolePermission[]> {
  const result = await callSessionAction<RolePermission[]>("getRoles");
  if (result.success && result.data) {
    return result.data.map((r: RolePermission) => ({
      roleName: r.roleName,
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
    }));
  }
  return [];
}

export function getRoutesForRole(permissions: string[]): string[] {
  return Object.entries(ROUTE_PERMISSION_MAP)
    .filter(([_, requiredPerms]) =>
      requiredPerms.some((rp) => permissions.includes("ALL") || permissions.includes(rp))
    )
    .map(([route]) => route);
}
