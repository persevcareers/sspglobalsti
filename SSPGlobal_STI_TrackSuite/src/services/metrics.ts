import { callSessionAction } from "./api";

export interface CachedMetrics {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  droppedStudents: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalCourses: number;
  activeCourses: number;
  totalBatches: number;
  ongoingBatches: number;
  completedBatches: number;
  upcomingBatches: number;
  totalTrainers: number;
  activeTrainers: number;
}

const defaultMetrics: CachedMetrics = {
  totalStudents: 0,
  activeStudents: 0,
  completedStudents: 0,
  droppedStudents: 0,
  totalLeads: 0,
  convertedLeads: 0,
  conversionRate: 0,
  totalCourses: 0,
  activeCourses: 0,
  totalBatches: 0,
  ongoingBatches: 0,
  completedBatches: 0,
  upcomingBatches: 0,
  totalTrainers: 0,
  activeTrainers: 0,
};

export async function getCachedMetrics(): Promise<CachedMetrics | null> {
  const result = await callSessionAction<CachedMetrics>("getCachedMetrics");
  if (result.success && result.data) {
    return result.data;
  }
  return null;
}

export async function computeAndStoreMetrics(): Promise<CachedMetrics | null> {
  const result = await callSessionAction<CachedMetrics>("computeAndStoreMetrics");
  if (result.success && result.data) {
    return result.data;
  }
  return null;
}

export async function metricValue(metric: keyof CachedMetrics): Promise<number> {
  const metrics = await getCachedMetrics();
  return metrics?.[metric] ?? defaultMetrics[metric];
}
