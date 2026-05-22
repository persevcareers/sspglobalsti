"use client";

import { motion } from "framer-motion";
import { useSheetsData } from "@/hooks/useSheetsData";
import { Student, Lead, Course, Batch } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, BookOpen, Layers, TrendingUp, GraduationCap, ArrowUpRight, Activity } from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { OnlineUsersWidget } from "@/components/dashboard/online-users";
import { fadeIn, staggerContainer, statCardVariants } from "@/lib/animations";
import { cn } from "@/lib/utils";

const GRADIENT_CARDS = [
  { from: "from-accent-base/10", via: "via-accent-base/5", border: "hover:border-accent-base/20" },
  { from: "from-emerald-500/10", via: "via-teal-500/5", border: "hover:border-emerald-500/20" },
  { from: "from-amber-500/10", via: "via-orange-500/5", border: "hover:border-amber-500/20" },
  { from: "from-blue-500/10", via: "via-cyan-500/5", border: "hover:border-blue-500/20" },
  { from: "from-rose-500/10", via: "via-pink-500/5", border: "hover:border-rose-500/20" },
];

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

  const ongoingBatches = batches.filter((b) => b.Status === "Ongoing").length;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Overview of your training institute metrics and activity.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Activity className="h-3.5 w-3.5" />
          <span>Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: Users, label: "Total Students", value: students.length, desc: "Enrolled learners", trend: "+12%", trendUp: true },
          { icon: Target, label: "Active Leads", value: leads.length, desc: "Prospects in pipeline", trend: "+8%", trendUp: true },
          { icon: BookOpen, label: "Active Courses", value: courses.length, desc: "Running programs", trend: `${courses.filter((c) => c.Status === "Active").length} active`, trendUp: true },
          { icon: Layers, label: "Total Batches", value: batches.length, desc: "Training groups", trend: `${ongoingBatches} ongoing`, trendUp: true },
          { icon: GraduationCap, label: "Ongoing Batches", value: ongoingBatches, desc: "Currently active", trend: batches.length > 0 ? `${Math.round((ongoingBatches / batches.length) * 100)}% rate` : "0%", trendUp: true },
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
          <AreaChart title="Student Enrollments" data={studentGrowthData} className="border-0 shadow-none bg-transparent" />
        </div>
        <div className="lg:col-span-3">
          <OnlineUsersWidget />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border border-white/[0.06] bg-card p-0 lg:col-span-7">
          <BarChart title="Batch Progress" data={batchProgressData} className="border-0 shadow-none bg-transparent" />
        </div>
      </div>
    </motion.div>
  );
}
