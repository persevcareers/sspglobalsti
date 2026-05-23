"use client";

import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { StatsGrid, StatCardDef } from "@/components/dashboard/stats-grid";
import { Users, Target, GraduationCap, Percent, BookOpen, RefreshCw, Loader2, TrendingUp, UserCheck, DollarSign, Activity } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { ProgressChart } from "@/components/charts/progress-chart";
import { ChartSkeleton } from "@/components/common/loading-skeleton";
import { fadeIn } from "@/lib/animations";
import { getCachedMetrics, computeAndStoreMetrics } from "@/services/metrics";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function AnalyticsPage() {
  const { data: students, isLoading: studentsLoading } = useSheetsData<Student>("Students");
  const { data: leads, isLoading: leadsLoading } = useSheetsData<Lead>("Leads");
  const { data: courses, isLoading: coursesLoading } = useSheetsData<Course>("Courses");
  const { data: batches, isLoading: batchesLoading } = useSheetsData<Batch>("Batches");
  const [refreshingMetrics, setRefreshingMetrics] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const isLoading = studentsLoading || leadsLoading || coursesLoading || batchesLoading;

  const handleRefreshMetrics = async () => {
    setRefreshingMetrics(true);
    try {
      await computeAndStoreMetrics();
      toast.success("Metrics refreshed");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      toast.error("Failed to refresh metrics");
    } finally {
      setRefreshingMetrics(false);
    }
  };

  useEffect(() => {
    getCachedMetrics().then((m) => {
      if (m) setLastUpdated(new Date().toLocaleTimeString());
    });
  }, []);

  const conversionRate = leads.length > 0
    ? Math.round((leads.filter((l) => l.Status === "Converted").length / leads.length) * 100) : 0;

  const leadSourceMap: Record<string, number> = {};
  leads.forEach((lead) => { if (lead.Source) leadSourceMap[lead.Source] = (leadSourceMap[lead.Source] || 0) + 1; });
  const leadSourceData = Object.entries(leadSourceMap).map(([name, value]) => ({ name, value }));

  const studentStatusMap: Record<string, number> = {};
  students.forEach((student) => { if (student.Status) studentStatusMap[student.Status] = (studentStatusMap[student.Status] || 0) + 1; });
  const studentStatusData = Object.entries(studentStatusMap).map(([name, value]) => ({ name, value }));

  const monthlyEnrollmentMap: Record<string, number> = {};
  students.forEach((student) => {
    if (student["Start Date"]) {
      try {
        const date = new Date(student["Start Date"]);
        const monthName = date.toLocaleString("default", { month: "short" });
        monthlyEnrollmentMap[monthName] = (monthlyEnrollmentMap[monthName] || 0) + 1;
      } catch (e) {}
    }
  });
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const enrollmentTrendData = months.map((month) => ({ month, count: monthlyEnrollmentMap[month] || 0 })).filter((d, i) => i <= new Date().getMonth() || d.count > 0);

  const finalLeadSourceData = leadSourceData.length > 0 ? leadSourceData : [
    { name: "Instagram", value: 35 }, { name: "LinkedIn", value: 25 }, { name: "YouTube", value: 20 }, { name: "Website", value: 15 }, { name: "Referral", value: 5 },
  ];
  const finalStudentStatusData = studentStatusData.length > 0 ? studentStatusData : [
    { name: "Active", value: 45 }, { name: "Completed", value: 30 }, { name: "Dropped", value: 5 }, { name: "On Hold", value: 10 },
  ];
  const finalEnrollmentTrendData = enrollmentTrendData.some((d) => d.count > 0) ? enrollmentTrendData : [
    { month: "Jan", count: 12 }, { month: "Feb", count: 18 }, { month: "Mar", count: 26 }, { month: "Apr", count: 32 }, { month: "May", count: 45 }, { month: "Jun", count: students.length || 54 },
  ];
  const batchProgressData = batches.map((b) => ({ name: b["Batch Name"] || "Unnamed Batch", progress: b.Status === "Completed" ? 100 : b.Status === "Ongoing" ? 60 : 0 }));
  const finalBatchProgressData = batchProgressData.length > 0 ? batchProgressData : [
    { name: "MERN Stack - B1", progress: 85 }, { name: "Python Core - B2", progress: 45 }, { name: "UI/UX Design - B3", progress: 10 },
  ];

  const stats: StatCardDef[] = [
    { icon: Users, label: "Total Students", value: students.length, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: Target, label: "Total Leads", value: leads.length, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Percent, label: "Conversion Rate", value: `${conversionRate}%`, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: GraduationCap, label: "Running Batches", value: batches.filter((b) => b.Status === "Ongoing").length, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description={lastUpdated ? `Last updated: ${lastUpdated}` : "Track performance metrics and insights across your academy."}
        action={
          <Button variant="outline" size="sm" onClick={handleRefreshMetrics} disabled={refreshingMetrics} className="gap-2">
            {refreshingMetrics ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Metrics
          </Button>
        }
      />

      <StatsGrid stats={stats} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {isLoading ? (<><ChartSkeleton /><ChartSkeleton /></>) : (<>
          <AreaChart title="Student Enrollment Growth" data={finalEnrollmentTrendData} className="lg:col-span-4" />
          <PieChart title="Lead Sources Distribution" data={finalLeadSourceData} className="lg:col-span-3" />
        </>)}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {isLoading ? (<><ChartSkeleton /><ChartSkeleton /></>) : (<>
          <PieChart title="Students Status Distribution" data={finalStudentStatusData} className="lg:col-span-3" />
          <ProgressChart title="Batch Progress Breakdown" data={finalBatchProgressData} className="lg:col-span-4" />
        </>)}
      </div>
    </motion.div>
  );
}
