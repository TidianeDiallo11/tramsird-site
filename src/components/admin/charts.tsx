"use client";

import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatGNF, formatNumber } from "@/lib/utils";

const gridColor = "var(--border)";
const textColor = "var(--muted-foreground)";
const brand = "var(--brand)";

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs card-shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{formatter(payload[0].value)}</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={brand} stopOpacity={0.35} />
            <stop offset="100%" stopColor={brand} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: textColor }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatNumber(v)}
          width={56}
        />
        <Tooltip content={<ChartTooltip formatter={formatGNF} />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke={brand}
          strokeWidth={2}
          fill="url(#revenueFill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopProductsChart({ data }: { data: { name: string; quantity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={gridColor} />
        <XAxis type="number" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: textColor }}
          axisLine={false}
          tickLine={false}
          width={140}
          tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => `${formatNumber(v)} unités`} />} />
        <Bar dataKey="quantity" fill={brand} radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
