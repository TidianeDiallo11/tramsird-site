import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatGNF } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function RevenueHeroCard({
  revenue,
  trend,
  profit,
  canSeeProfit,
}: {
  revenue: number;
  trend: number;
  profit?: number;
  canSeeProfit: boolean;
}) {
  const positive = trend >= 0;
  const margin = canSeeProfit && profit !== undefined && revenue > 0 ? (profit / revenue) * 100 : undefined;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-strong to-brand p-6 text-brand-foreground shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-brand-foreground/70">Chiffre d&apos;affaires</p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full bg-brand-foreground/10 px-2.5 py-1 text-xs font-bold",
            positive ? "text-brand-foreground" : "text-brand-foreground/80",
          )}
        >
          {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(trend).toFixed(1)}%
        </span>
      </div>

      <p className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums">{formatGNF(revenue)}</p>

      <div className="mt-5 flex items-stretch border-t border-brand-foreground/15 pt-4">
        {canSeeProfit && profit !== undefined ? (
          <>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-semibold text-brand-foreground/70">Bénéfice brut</p>
              <p className="text-lg font-bold tabular-nums">{formatGNF(profit)}</p>
            </div>
            <div className="mx-4 w-px bg-brand-foreground/15" />
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-semibold text-brand-foreground/70">Marge</p>
              <p className="text-lg font-bold tabular-nums">{margin !== undefined ? `${margin.toFixed(1)}%` : "—"}</p>
            </div>
          </>
        ) : (
          <p className="text-xs font-medium text-brand-foreground/60">Bénéfice réservé aux managers</p>
        )}
      </div>
    </div>
  );
}
