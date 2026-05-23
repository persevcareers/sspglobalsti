"use client";

import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { Users, Target, BookOpen, ArrowUpRight } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { OnlineUsersWidget } from "@/components/dashboard/online-users";
import { fadeIn, statCardVariants } from "@/lib/animations";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: students, isLoading: studentsLoading } = useSheetsData<Student>("Students");
  const { data: leads, isLoading: leadsLoading } = useSheetsData<Lead>("Leads");
  const { data: courses, isLoading: coursesLoading } = useSheetsData<Course>("Courses");
  const { data: batches, isLoading: batchesLoading } = useSheetsData<Batch>("Batches");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true }));
  }, []);

  const isLoading = studentsLoading || leadsLoading || coursesLoading || batchesLoading;

  const studentGrowthData = [
    { month: "Jan", count: 45 }, { month: "Feb", count: 52 }, { month: "Mar", count: 68 },
    { month: "Apr", count: 74 }, { month: "May", count: 90 }, { month: "Jun", count: students.length > 90 ? students.length : 105 },
  ];

  const batchProgressData = [
    { name: "Batch A", value: 85 }, { name: "Batch B", value: 45 }, { name: "Batch C", value: 20 }, { name: "Batch D", value: 95 },
  ];

  const gradientCards = [
    {
      title: "Total Students", icon: Users, value: students.length, subtitle: "+12% from last month",
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active Leads", icon: Target, value: leads.length, subtitle: "+4% from last month",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent", iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Active Courses", icon: BookOpen, value: courses.length, subtitle: "Across all programs",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description={lastUpdated ? `Last updated: ${lastUpdated}` : "Welcome to your academy dashboard."}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {gradientCards.map((card, i) => (
          <motion.div
            key={card.title} custom={i} variants={statCardVariants} initial="hidden" animate="visible"
          >
            <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${card.gradient} p-4 shadow-sm transition-all duration-300 hover:scale-[1.02]`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className={`rounded-lg p-2 ${card.iconBg}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <CardContent className="p-0 mt-3">
                <div className="text-2xl font-bold">{isLoading ? "..." : card.value}</div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="font-medium text-emerald-500">↑ 12%</span>
                  {card.subtitle}
                </p>
              </CardContent>
            </div>
          </motion.div>
        ))}
        <OnlineUsersWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AreaChart title="Student Enrollments (2024)" data={studentGrowthData} className="lg:col-span-4" />
        <BarChart title="Batch Progress (%)" data={batchProgressData} className="lg:col-span-3" />
      </div>
    </motion.div>
  );
}
