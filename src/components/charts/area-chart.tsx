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

interface AreaChartProps {
  title: string;
  data: { month: string; count: number }[];
  className?: string;
}

export function AreaChart({ title, data, className }: AreaChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsAreaChart data={data}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="month"
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
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
