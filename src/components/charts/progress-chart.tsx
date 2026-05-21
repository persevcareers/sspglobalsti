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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressChartProps {
  title: string;
  data: { name: string; progress: number }[];
  className?: string;
}

export function ProgressChart({ title, data, className }: ProgressChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsBarChart
              data={data}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                type="number"
                domain={[0, 100]}
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                formatter={(value: any) => [`${value}%`, "Progress"]}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "13px",
                }}
              />
              <Bar
                dataKey="progress"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
