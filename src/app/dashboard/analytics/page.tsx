"use client";

import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Target, GraduationCap, Percent, BookOpen } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { ProgressChart } from "@/components/charts/progress-chart";

export default function AnalyticsPage() {
  const { data: students, isLoading: studentsLoading } = useSheetsData<Student>("Students");
  const { data: leads, isLoading: leadsLoading } = useSheetsData<Lead>("Leads");
  const { data: courses, isLoading: coursesLoading } = useSheetsData<Course>("Courses");
  const { data: batches, isLoading: batchesLoading } = useSheetsData<Batch>("Batches");

  const isLoading = studentsLoading || leadsLoading || coursesLoading || batchesLoading;

  // Process data for charts
  const leadSourceMap: Record<string, number> = {};
  leads.forEach((lead) => {
    if (lead.Source) {
      leadSourceMap[lead.Source] = (leadSourceMap[lead.Source] || 0) + 1;
    }
  });
  const leadSourceData = Object.entries(leadSourceMap).map(([name, value]) => ({
    name,
    value,
  }));

  const studentStatusMap: Record<string, number> = {};
  students.forEach((student) => {
    if (student.Status) {
      studentStatusMap[student.Status] = (studentStatusMap[student.Status] || 0) + 1;
    }
  });
  const studentStatusData = Object.entries(studentStatusMap).map(([name, value]) => ({
    name,
    value,
  }));

  const conversionRate = leads.length > 0
    ? Math.round((leads.filter((l) => l.Status === "Converted").length / leads.length) * 100)
    : 0;

  // Monthly enrollment metrics (Mock aggregation based on active/inactive or start dates)
  const monthlyEnrollmentMap: Record<string, number> = {};
  students.forEach((student) => {
    if (student["Start Date"]) {
      try {
        const date = new Date(student["Start Date"]);
        const monthName = date.toLocaleString("default", { month: "short" });
        monthlyEnrollmentMap[monthName] = (monthlyEnrollmentMap[monthName] || 0) + 1;
      } catch (e) {
        // Fallback for custom formatted dates
      }
    }
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const enrollmentTrendData = months
    .map((month) => ({
      month,
      count: monthlyEnrollmentMap[month] || 0,
    }))
    .filter((d, i) => i <= new Date().getMonth() || d.count > 0);

  // Fallback to demo data if sheets are empty
  const finalLeadSourceData = leadSourceData.length > 0 ? leadSourceData : [
    { name: "Instagram", value: 35 },
    { name: "LinkedIn", value: 25 },
    { name: "YouTube", value: 20 },
    { name: "Website", value: 15 },
    { name: "Referral", value: 5 },
  ];

  const finalStudentStatusData = studentStatusData.length > 0 ? studentStatusData : [
    { name: "Active", value: 45 },
    { name: "Completed", value: 30 },
    { name: "Dropped", value: 5 },
    { name: "On Hold", value: 10 },
  ];

  const finalEnrollmentTrendData = enrollmentTrendData.some((d) => d.count > 0) ? enrollmentTrendData : [
    { month: "Jan", count: 12 },
    { month: "Feb", count: 18 },
    { month: "Mar", count: 26 },
    { month: "Apr", count: 32 },
    { month: "May", count: 45 },
    { month: "Jun", count: students.length || 54 },
  ];

  const batchProgressData = batches.map((b) => ({
    name: b["Batch Name"] || "Unnamed Batch",
    progress: b.Status === "Completed" ? 100 : b.Status === "Ongoing" ? 60 : 0,
  }));

  const finalBatchProgressData = batchProgressData.length > 0 ? batchProgressData : [
    { name: "MERN Stack - B1", progress: 85 },
    { name: "Python Core - B2", progress: 45 },
    { name: "UI/UX Design - B3", progress: 10 },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Active profiles on system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">Total captured opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Leads converted to students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Running Batches</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.filter((b) => b.Status === "Ongoing").length}
            </div>
            <p className="text-xs text-muted-foreground">Batches currently in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Charting section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AreaChart
          title="Student Enrollment Growth"
          data={finalEnrollmentTrendData}
          className="lg:col-span-4"
        />
        <PieChart
          title="Lead Sources Distribution"
          data={finalLeadSourceData}
          className="lg:col-span-3"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <PieChart
          title="Students Status Distribution"
          data={finalStudentStatusData}
          className="lg:col-span-3"
        />
        <ProgressChart
          title="Batch Progress Breakdown"
          data={finalBatchProgressData}
          className="lg:col-span-4"
        />
      </div>
    </div>
  );
}
