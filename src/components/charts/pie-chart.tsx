"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "var(--accent-base)",
  "oklch(0.627 0.194 149.213)", // Emerald
  "oklch(0.769 0.188 70.08)",   // Amber
  "oklch(0.625 0.233 16.037)",  // Rose
  "oklch(0.505 0.213 298.376)", // Violet
  "oklch(0.685 0.169 198.376)", // Cyan
];

interface PieChartProps {
  title: string;
  data: { name: string; value: number }[];
  className?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill || "var(--accent-base)" }} />
        <div>
          <span className="font-semibold text-muted-foreground">{data.name}: </span>
          <span className="font-bold text-foreground">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function PieChart({ title, data, className }: PieChartProps) {
  const { theme } = useTheme();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64" key={theme}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="var(--card)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "var(--muted-foreground)" }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
