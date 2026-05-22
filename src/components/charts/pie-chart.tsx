"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAccentTheme } from "@/hooks/useAccentTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FIXED_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/[0.12] bg-[#151520]/95 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_color-mix(in srgb,var(--accent-base) 10%,transparent)] backdrop-blur-xl">
        <p className="text-[11px] font-medium text-foreground">{payload[0].name}</p>
        <p className="text-sm font-bold text-accent-base">{payload[0].value} ({Math.round((payload[0].payload?.value || 0) / (payload[0].payload?.total || 1) * 100)}%)</p>
      </div>
    );
  }
  return null;
};

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[11px] text-muted-foreground/70">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface PieChartProps {
  title: string;
  data: { name: string; value: number }[];
  className?: string;
}

export function PieChart({ title, data, className }: PieChartProps) {
  const { accentPalette } = useAccentTheme();
  const COLORS = [accentPalette.base, ...FIXED_COLORS];
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map((d) => ({ ...d, total }));

  return (
    <Card className={cn("border-white/[0.06]", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RechartsPieChart>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
