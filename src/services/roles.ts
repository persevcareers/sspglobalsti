"use client";

import { fetchSheetData } from "@/services/api";

export interface RoleEntry {
  "Role Name": string;
  Permissions: string;
}

const PERMISSION_ROUTE_MAP: Record<string, string[]> = {
  "MANAGE_STUDENTS": ["/dashboard/students"],
  "VIEW_STUDENTS": ["/dashboard/students"],
  "MANAGE_TRAINERS": ["/dashboard/trainers"],
  "MANAGE_SCHEDULES": ["/dashboard/schedules"],
  "VIEW_SCHEDULES": ["/dashboard/schedules"],
  "MANAGE_COURSES": ["/dashboard/courses"],
  "VIEW_COURSES": ["/dashboard/courses"],
  "MANAGE_BATCHES": ["/dashboard/batches"],
  "MANAGE_LEADS": ["/dashboard/leads"],
  "VIEW_LEADS": ["/dashboard/leads"],
  "VIEW_ANALYTICS": ["/dashboard/analytics"],
  "MANAGE_USERS": ["/dashboard/settings"],
  "MANAGE_ROLES": ["/dashboard/settings"],
};

const FALLBACK_PERMISSIONS: Record<string, string[]> = {
  "Super Admin": ["ALL"],
  "Admin": ["MANAGE_STUDENTS", "MANAGE_TRAINERS", "MANAGE_SCHEDULES", "MANAGE_COURSES", "MANAGE_BATCHES", "MANAGE_LEADS", "VIEW_ANALYTICS", "MANAGE_USERS", "MANAGE_ROLES"],
  "Trainer": ["MANAGE_BATCHES", "MANAGE_SCHEDULES", "VIEW_STUDENTS"],
  "Student": ["VIEW_COURSES", "VIEW_SCHEDULES"],
  "HR": ["MANAGE_LEADS", "VIEW_STUDENTS", "VIEW_SCHEDULES"],
  "Staff": ["VIEW_STUDENTS", "VIEW_SCHEDULES", "VIEW_LEADS"],
};

let cachedRoles: Record<string, string[]> | null = null;

export async function loadRoles(): Promise<Record<string, string[]>> {
  if (cachedRoles) return cachedRoles;
  try {
    const entries = await fetchSheetData<RoleEntry>("Roles");
    if (entries.length === 0) {
      cachedRoles = { ...FALLBACK_PERMISSIONS };
      return cachedRoles;
    }
    const roles: Record<string, string[]> = {};
    for (const entry of entries) {
      const name = entry["Role Name"];
      const perms = entry.Permissions ? entry.Permissions.split(",").map((p) => p.trim()).filter(Boolean) : [];
      roles[name] = perms;
    }
    cachedRoles = roles;
    return roles;
  } catch {
    cachedRoles = { ...FALLBACK_PERMISSIONS };
    return cachedRoles;
  }
}

export function getRoutesForRole(roleName: string, roles: Record<string, string[]>): string[] {
  const perms = roles[roleName];
  if (!perms) return ["/dashboard/settings"];
  if (perms.includes("ALL")) return Object.values(PERMISSION_ROUTE_MAP).flat().filter((v, i, a) => a.indexOf(v) === i);
  const routes = new Set<string>();
  routes.add("/dashboard");
  for (const perm of perms) {
    const mapped = PERMISSION_ROUTE_MAP[perm];
    if (mapped) mapped.forEach((r) => routes.add(r));
  }
  return Array.from(routes);
}

export const DEFAULT_ROUTES: Record<string, string[]> = {
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
