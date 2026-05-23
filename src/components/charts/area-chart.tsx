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
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AreaChartProps {
  title: string;
  data: { month: string; count: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-bold text-accent-base" style={{ color: "var(--accent-base)" }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function AreaChart({ title, data, className }: AreaChartProps) {
  const { theme } = useTheme();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" key={theme}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsAreaChart data={data}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-base)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-base)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="month"
                className="text-[10px] text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-[10px] text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: "var(--accent-base)", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--accent-base)"
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
