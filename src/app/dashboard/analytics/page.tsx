"use client";

import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Percent, GraduationCap, TrendingUp, PieChart as PieIcon, ArrowUpRight, Activity, BarChart3, LineChart } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { ProgressChart } from "@/components/charts/progress-chart";
import { ChartSkeleton } from "@/components/common/loading-skeleton";
import { fadeIn, staggerContainer, statCardVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

const GRADIENT_CARDS = [
  { from: "from-accent-base/10", via: "via-accent-base/5", border: "hover:border-accent-base/20" },
  { from: "from-emerald-500/10", via: "via-teal-500/5", border: "hover:border-emerald-500/20" },
  { from: "from-amber-500/10", via: "via-orange-500/5", border: "hover:border-amber-500/20" },
  { from: "from-blue-500/10", via: "via-cyan-500/5", border: "hover:border-blue-500/20" },
];

export default function AnalyticsPage() {
  const { data: students } = useSheetsData<Student>("Students");
  const { data: leads } = useSheetsData<Lead>("Leads");
  const { data: batches } = useSheetsData<Batch>("Batches");
  const isLoading = false;

  const leadSourceMap: Record<string, number> = {};
  leads.forEach((l) => { if (l.Source) leadSourceMap[l.Source] = (leadSourceMap[l.Source] || 0) + 1; });

  const studentStatusMap: Record<string, number> = {};
  students.forEach((s) => { if (s.Status) studentStatusMap[s.Status] = (studentStatusMap[s.Status] || 0) + 1; });

  const conversionRate = leads.length > 0 ? Math.round((leads.filter((l) => l.Status === "Converted").length / leads.length) * 100) : 0;

  const monthlyEnrollmentMap: Record<string, number> = {};
  students.forEach((s) => {
    if (s["Start Date"]) {
      try { const d = new Date(s["Start Date"]); monthlyEnrollmentMap[d.toLocaleString("default", { month: "short" })] = (monthlyEnrollmentMap[d.toLocaleString("default", { month: "short" })] || 0) + 1; } catch { /* ignore */ }
    }
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const enrollmentTrendData = months.map((m) => ({ month: m, count: monthlyEnrollmentMap[m] || 0 })).filter((d, i) => i <= new Date().getMonth() || d.count > 0);

  const finalLeadSourceData = Object.entries(leadSourceMap).length > 0 ? Object.entries(leadSourceMap).map(([name, value]) => ({ name, value })) : [
    { name: "Instagram", value: 35 }, { name: "LinkedIn", value: 25 }, { name: "YouTube", value: 20 }, { name: "Website", value: 15 }, { name: "Referral", value: 5 },
  ];

  const finalStudentStatusData = Object.entries(studentStatusMap).length > 0 ? Object.entries(studentStatusMap).map(([name, value]) => ({ name, value })) : [
    { name: "Active", value: 45 }, { name: "Completed", value: 30 }, { name: "Dropped", value: 5 }, { name: "On Hold", value: 10 },
  ];

  const finalEnrollmentTrendData = enrollmentTrendData.some((d) => d.count > 0) ? enrollmentTrendData : [
    { month: "Jan", count: 12 }, { month: "Feb", count: 18 }, { month: "Mar", count: 26 }, { month: "Apr", count: 32 }, { month: "May", count: 45 }, { month: "Jun", count: students.length || 54 },
  ];

  const batchProgressData = batches.length > 0 ? batches.map((b) => ({ name: b["Batch Name"] || "Unnamed", progress: b.Status === "Completed" ? 100 : b.Status === "Ongoing" ? 60 : 0 })) : [
    { name: "MERN Stack - B1", progress: 85 }, { name: "Python Core - B2", progress: 45 }, { name: "UI/UX Design - B3", progress: 10 },
  ];

  const activeStudents = students.filter((s) => s.Status === "Active").length;
  const runningBatches = batches.filter((b) => b.Status === "Ongoing").length;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Data-driven insights into enrollments, conversions, and performance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Real-time analytics</span>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total Students", value: students.length, desc: "Active profiles", trend: `${activeStudents} active`, trendUp: true },
          { icon: Target, label: "Total Leads", value: leads.length, desc: "Captured opportunities", trend: leads.filter((l) => l.Status === "New").length + " new", trendUp: true },
          { icon: Percent, label: "Conversion Rate", value: `${conversionRate}%`, desc: "Leads → Students", trend: conversionRate >= 50 ? "Above avg" : "Below avg", trendUp: conversionRate >= 50 },
          { icon: GraduationCap, label: "Running Batches", value: runningBatches, desc: "Currently in progress", trend: batches.length > 0 ? `${Math.round((runningBatches / batches.length) * 100)}% active` : "0%", trendUp: true },
        ].map(({ icon: Icon, label, value, desc, trend, trendUp }, i) => (
          <motion.div key={label} custom={i} variants={statCardVariants}>
            <Card className={cn(
              "relative overflow-hidden border-white/[0.06] bg-card shadow-none transition-all duration-300 hover:scale-[1.02]",
              GRADIENT_CARDS[i].border
            )}>
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", GRADIENT_CARDS[i].from, GRADIENT_CARDS[i].via)} />
              <CardContent className="relative flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                    {trend && (
                      <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", trendUp ? "text-emerald-400" : "text-red-400")}>
                        <ArrowUpRight className={cn("h-3 w-3", !trendUp && "rotate-90")} />
                        {trend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60">{label}</p>
                  <p className="text-[10px] text-muted-foreground/40">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border border-white/[0.06] bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/[0.10] hover:shadow-[0_8px_40px_-6px_rgba(99,102,241,0.08)] lg:col-span-4">
          <AreaChart title="Student Enrollment Growth" data={finalEnrollmentTrendData} className="border-0 shadow-none bg-transparent" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/[0.10] hover:shadow-[0_8px_40px_-6px_rgba(99,102,241,0.08)] lg:col-span-3">
          <PieChart title="Lead Sources Distribution" data={finalLeadSourceData} className="border-0 shadow-none bg-transparent" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border border-white/[0.06] bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/[0.10] hover:shadow-[0_8px_40px_-6px_rgba(99,102,241,0.08)] lg:col-span-3">
          <PieChart title="Student Status Distribution" data={finalStudentStatusData} className="border-0 shadow-none bg-transparent" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/[0.10] hover:shadow-[0_8px_40px_-6px_rgba(99,102,241,0.08)] lg:col-span-4">
          <ProgressChart title="Batch Progress Breakdown" data={batchProgressData} className="border-0 shadow-none bg-transparent" />
        </div>
      </div>
    </motion.div>
  );
}
