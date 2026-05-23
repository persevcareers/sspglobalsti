"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressChartProps {
  title: string;
  data: { name: string; progress: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
        <p className="font-semibold text-muted-foreground">{data.name}</p>
        <p className="mt-1 text-sm font-bold text-accent-base" style={{ color: "var(--accent-base)" }}>
          Progress: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export function ProgressChart({ title, data, className }: ProgressChartProps) {
  const { theme } = useTheme();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" key={theme}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsBarChart
              data={data}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                type="number"
                domain={[0, 100]}
                className="text-[10px] text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                className="text-[10px] text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="progress"
                fill="var(--accent-base)"
                radius={[0, 6, 6, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
