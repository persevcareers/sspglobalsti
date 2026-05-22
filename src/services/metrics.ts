"use client";

import { fetchSheetData, modifySheetData } from "@/services/api";

const METRICS_SHEET = "Analytics";

export interface MetricEntry {
  "Metric Name": string;
  Value: string;
  "Last Updated": string;
}

export async function getCachedMetrics(): Promise<MetricEntry[]> {
  try {
    return await fetchSheetData<MetricEntry>(METRICS_SHEET);
  } catch {
    return [];
  }
}

export async function computeAndStoreMetrics(): Promise<MetricEntry[]> {
  const [students, leads, batches, courses, trainers] = await Promise.all([
    fetchSheetData<any>("Students"),
    fetchSheetData<any>("Leads"),
    fetchSheetData<any>("Batches"),
    fetchSheetData<any>("Courses"),
    fetchSheetData<any>("Trainers"),
  ]);

  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const activeStudents = students.filter((s: any) => s.Status === "Active").length;
  const completedStudents = students.filter((s: any) => s.Status === "Completed").length;
  const droppedStudents = students.filter((s: any) => s.Status === "Dropped" || s.Status === "On Hold").length;
  const runningBatches = batches.filter((b: any) => b.Status === "Ongoing").length;
  const completedBatches = batches.filter((b: any) => b.Status === "Completed").length;
  const newLeads = leads.filter((l: any) => l.Status === "New").length;
  const convertedLeads = leads.filter((l: any) => l.Status === "Converted").length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
  const activeTrainers = trainers.filter((t: any) => t.Status === "Active").length;
  const activeCourses = courses.filter((c: any) => c.Status === "Active").length;

  const metricsToStore: MetricEntry[] = [
    { "Metric Name": "totalStudents", Value: String(students.length), "Last Updated": now },
    { "Metric Name": "activeStudents", Value: String(activeStudents), "Last Updated": now },
    { "Metric Name": "completedStudents", Value: String(completedStudents), "Last Updated": now },
    { "Metric Name": "droppedStudents", Value: String(droppedStudents), "Last Updated": now },
    { "Metric Name": "totalBatches", Value: String(batches.length), "Last Updated": now },
    { "Metric Name": "runningBatches", Value: String(runningBatches), "Last Updated": now },
    { "Metric Name": "completedBatches", Value: String(completedBatches), "Last Updated": now },
    { "Metric Name": "totalLeads", Value: String(leads.length), "Last Updated": now },
    { "Metric Name": "newLeads", Value: String(newLeads), "Last Updated": now },
    { "Metric Name": "convertedLeads", Value: String(convertedLeads), "Last Updated": now },
    { "Metric Name": "conversionRate", Value: String(conversionRate), "Last Updated": now },
    { "Metric Name": "totalCourses", Value: String(courses.length), "Last Updated": now },
    { "Metric Name": "activeCourses", Value: String(activeCourses), "Last Updated": now },
    { "Metric Name": "totalTrainers", Value: String(trainers.length), "Last Updated": now },
    { "Metric Name": "activeTrainers", Value: String(activeTrainers), "Last Updated": now },
  ];

  const existing = await fetchSheetData<MetricEntry>(METRICS_SHEET);
  const existingNames = new Set(existing.map((m: any) => m["Metric Name"]));

  for (const metric of metricsToStore) {
    if (existingNames.has(metric["Metric Name"])) {
      await modifySheetData("update", METRICS_SHEET, metric);
    } else {
      await modifySheetData("create", METRICS_SHEET, metric);
    }
  }

  return metricsToStore;
}

export function metricValue(metrics: MetricEntry[], name: string, fallback: number = 0): number {
  const entry = metrics.find((m) => m["Metric Name"] === name);
  return entry ? parseInt(entry.Value, 10) || fallback : fallback;
}
