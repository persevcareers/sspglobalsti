"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarChartProps {
  title: string;
  data: { name: string; value: number }[];
  className?: string;
}

const COLORS = [
  "var(--accent-base)",
  "oklch(0.627 0.194 149.213)", // Emerald
  "oklch(0.769 0.188 70.08)",   // Amber
  "oklch(0.625 0.233 16.037)",  // Rose
  "oklch(0.505 0.213 298.376)", // Violet
  "oklch(0.685 0.169 198.376)", // Cyan
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
        <p className="font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-bold" style={{ color: payload[0].fill || "var(--accent-base)" }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function BarChart({ title, data, className }: BarChartProps) {
  const { theme } = useTheme();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" key={theme}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsBarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="name"
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
                cursor={{ fill: "var(--accent-soft)", opacity: 0.5 }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
