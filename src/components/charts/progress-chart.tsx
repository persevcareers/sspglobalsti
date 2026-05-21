"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/[0.12] bg-[#151520]/95 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(99,102,241,0.1)] backdrop-blur-xl">
        <p className="text-[11px] font-medium text-foreground">{label}</p>
        <p className="text-sm font-bold text-indigo-400">{payload[0].value}% complete</p>
      </div>
    );
  }
  return null;
};

interface ProgressChartProps {
  title: string;
  data: { name: string; progress: number }[];
  className?: string;
}

export function ProgressChart({ title, data, className }: ProgressChartProps) {
  return (
    <Card className={cn("border-white/[0.06]", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsBarChart data={data} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="progress" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
