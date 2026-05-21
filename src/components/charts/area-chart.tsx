"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AreaChartProps {
  title: string;
  data: { month: string; count: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/[0.12] bg-[#151520]/95 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(99,102,241,0.1)] backdrop-blur-xl">
        <p className="text-[11px] font-medium text-foreground">{label}</p>
        <p className="text-sm font-bold text-indigo-400">{payload[0].value} students</p>
      </div>
    );
  }
  return null;
};

export function AreaChart({ title, data, className }: AreaChartProps) {
  return (
    <Card className={cn("border-white/[0.06]", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsAreaChart data={data}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(99,102,241,0.2)", strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                activeDot={{ r: 5, fill: "#6366f1", stroke: "#151520", strokeWidth: 2 }}
              />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
