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
import { useAccentTheme } from "@/hooks/useAccentTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BarChartProps {
  title: string;
  data: { name: string; value: number }[];
  className?: string;
}

const FIXED_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-chart-tooltip-bg px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_color-mix(in srgb,var(--accent-base) 10%,transparent)] backdrop-blur-xl">
        <p className="text-[11px] font-medium text-foreground">{label}</p>
        <p className="text-sm font-bold text-accent-base">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export function BarChart({ title, data, className }: BarChartProps) {
  const { accentPalette } = useAccentTheme();
  const COLORS = [accentPalette.base, ...FIXED_COLORS];
  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsBarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--chart-text)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--chart-axis)" }}
              />
              <YAxis
                tick={{ fill: "var(--chart-text)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--chart-cursor)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
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
