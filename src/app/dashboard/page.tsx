"use client";

import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Target, BookOpen } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { OnlineUsersWidget } from "@/components/dashboard/online-users";

export default function DashboardPage() {
  const { data: students, isLoading: studentsLoading } = useSheetsData<Student>("Students");
  const { data: leads, isLoading: leadsLoading } = useSheetsData<Lead>("Leads");
  const { data: courses, isLoading: coursesLoading } = useSheetsData<Course>("Courses");
  const { data: batches, isLoading: batchesLoading } = useSheetsData<Batch>("Batches");

  const isLoading = studentsLoading || leadsLoading || coursesLoading || batchesLoading;

  const studentGrowthData = [
    { month: "Jan", count: 45 },
    { month: "Feb", count: 52 },
    { month: "Mar", count: 68 },
    { month: "Apr", count: 74 },
    { month: "May", count: 90 },
    { month: "Jun", count: students.length > 90 ? students.length : 105 },
  ];

  const batchProgressData = [
    { name: "Batch A", value: 85 },
    { name: "Batch B", value: 45 },
    { name: "Batch C", value: 20 },
    { name: "Batch D", value: 95 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : students.length}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : leads.length}</div>
            <p className="text-xs text-muted-foreground">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : courses.length}</div>
            <p className="text-xs text-muted-foreground">Across all programs</p>
          </CardContent>
        </Card>
        <OnlineUsersWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AreaChart
          title="Student Enrollments (2024)"
          data={studentGrowthData}
          className="lg:col-span-4"
        />
        <BarChart
          title="Batch Progress (%)"
          data={batchProgressData}
          className="lg:col-span-3"
        />
      </div>
    </div>
  );
}
