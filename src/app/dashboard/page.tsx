"use client";

import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, BookOpen, Layers, TrendingUp, GraduationCap } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { OnlineUsersWidget } from "@/components/dashboard/online-users";
import { fadeIn, staggerContainer, statCardVariants } from "@/lib/animations";

export default function DashboardPage() {
  const { data: students } = useSheetsData<Student>("Students");
  const { data: leads } = useSheetsData<Lead>("Leads");
  const { data: courses } = useSheetsData<Course>("Courses");
  const { data: batches } = useSheetsData<Batch>("Batches");

  const studentGrowthData = [
    { month: "Jan", count: 45 }, { month: "Feb", count: 52 }, { month: "Mar", count: 68 },
    { month: "Apr", count: 74 }, { month: "May", count: 90 }, { month: "Jun", count: Math.max(students.length, 105) },
  ];

  const batchProgressData = [
    { name: "Batch A", value: 85 }, { name: "Batch B", value: 45 },
    { name: "Batch C", value: 20 }, { name: "Batch D", value: 95 },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground/70">Overview of your training institute metrics and activity.</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: Users, label: "Total Students", value: students.length, desc: "Enrolled learners" },
          { icon: Target, label: "Active Leads", value: leads.length, desc: "Prospects in pipeline" },
          { icon: BookOpen, label: "Active Courses", value: courses.length, desc: "Running programs" },
          { icon: Layers, label: "Total Batches", value: batches.length, desc: "Training groups" },
          { icon: GraduationCap, label: "Ongoing Batches", value: batches.filter((b) => b.Status === "Ongoing").length, desc: "Currently active" },
        ].map(({ icon: Icon, label, value, desc }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className="border-white/[0.06] bg-card shadow-none transition-all duration-200 hover:border-white/[0.10]">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground/60">{label}</p>
                  <p className="text-[10px] text-muted-foreground/40">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AreaChart
          title="Student Enrollments"
          data={studentGrowthData}
          className="rounded-xl border border-white/[0.06] bg-card lg:col-span-4"
        />
        <div className="lg:col-span-3">
          <OnlineUsersWidget />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <BarChart
          title="Batch Progress"
          data={batchProgressData}
          className="rounded-xl border border-white/[0.06] bg-card lg:col-span-7"
        />
      </div>
    </motion.div>
  );
}
