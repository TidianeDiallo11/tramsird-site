import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  accent = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  hint?: string;
  accent?: "brand" | "accent" | "success" | "info";
}) {
  const positive = (trend?.value ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accent === "brand" && "bg-brand-soft text-brand-strong",
              accent === "accent" && "bg-accent-soft text-accent-foreground",
              accent === "success" && "bg-success-soft text-success",
              accent === "info" && "bg-info-soft text-info",
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
      {(trend || hint) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                positive ? "text-success" : "text-danger",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          )}
          <span className="text-muted-foreground">
            {trend?.label ?? hint}
          </span>
        </div>
      )}
    </Card>
  );
}
