"use client";

import { sheetsService } from "./sheets";

export async function getDashboardMetrics() {
  const [students, courses, trainers, leads, batches] = await Promise.all([
    sheetsService.students.getAll(),
    sheetsService.courses.getAll(),
    sheetsService.trainers.getAll(),
    sheetsService.leads.getAll(),
    sheetsService.batches.getAll(),
  ]);

  return {
    totalStudents: students.data?.length || 0,
    activeBatches: batches.data?.filter((b: any) => b.status === "active").length || 0,
    totalCourses: courses.data?.length || 0,
    totalTrainers: trainers.data?.filter((t: any) => t.status === "active").length || 0,
    totalLeads: leads.data?.length || 0,
  };
}

export async function getStudentAnalytics() {
  const res = await sheetsService.students.getAll();
  const students = res.data || [];
  const statusCounts: Record<string, number> = {};
  const monthlyGrowth: Record<string, number> = {};

  students.forEach((s: any) => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    if (s.createdAt) {
      const month = s.createdAt.substring(0, 7);
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
    }
  });

  return {
    total: students.length,
    byStatus: statusCounts,
    monthlyGrowth: Object.entries(monthlyGrowth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
}

export async function getLeadAnalytics() {
  const res = await sheetsService.leads.getAll();
  const leads = res.data || [];
  const sourceCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  leads.forEach((l: any) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  });

  return {
    total: leads.length,
    bySource: sourceCounts,
    byStatus: statusCounts,
    conversionRate: leads.length > 0
      ? Math.round(((statusCounts["converted"] || 0) / leads.length) * 100)
      : 0,
  };
}

export async function getBatchAnalytics() {
  const res = await sheetsService.batches.getAll();
  const batches = res.data || [];
  return batches.map((b: any) => ({
    name: b.batchName,
    progress: Math.min(100, Number(b.studentCount || 0) * 10),
  }));
}
