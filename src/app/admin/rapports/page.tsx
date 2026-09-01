import type { Metadata } from "next";
import { BarChart3, Package, Users, Wallet } from "lucide-react";
import { getStaffSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import {
  resolvePeriod,
  getDashboardStats,
  getRevenueSeries,
  getTopProducts,
  type PeriodKey,
} from "@/lib/data/dashboard";
import { getLeastSoldProducts, getEmployeePerformance, getPaymentBreakdown, getCustomerInsights, getStockValuation } from "@/lib/data/reports";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PeriodSelector } from "@/components/admin/period-selector";
import { RevenueChart, TopProductsChart } from "@/components/admin/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { formatGNF } from "@/lib/utils";

export const metadata: Metadata = { title: "Rapports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const sp = await searchParams;
  const session = await getStaffSession();
  const canSeeProfit = session ? hasPermission(session.role, "reports.view_profit") : false;
  const period = (sp.periode as PeriodKey) ?? "30d";
  const { from, to } = resolvePeriod(period);

  const [stats, revenueSeries, topProducts, leastSold, employeePerf, paymentBreakdown, customerInsights, stockValuation] =
    await Promise.all([
      getDashboardStats(from, to),
      getRevenueSeries(from, to),
      getTopProducts(from, to),
      getLeastSoldProducts(from, to),
      getEmployeePerformance(from, to),
      getPaymentBreakdown(from, to),
      getCustomerInsights(from, to),
      getStockValuation(),
    ]);

  const maxPayment = Math.max(1, ...paymentBreakdown.map((p) => p.amount));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Rapports</h1>
          <p className="text-sm text-muted-foreground">Analyse complète de la performance de votre commerce</p>
        </div>
        <PeriodSelector />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatGNF(stats.revenue)} icon={Wallet} trend={{ value: stats.revenueTrend }} />
        {canSeeProfit ? (
          <StatCard label="Bénéfice" value={formatGNF(stats.profit)} trend={{ value: stats.profitTrend }} accent="success" />
        ) : (
          <StatCard label="Bénéfice" value="Non autorisé" hint="Réservé aux managers" />
        )}
        <StatCard label="Nouveaux clients" value={customerInsights.newCustomers} icon={Users} accent="info" hint={`${customerInsights.totalCustomers} au total`} />
        <StatCard label="Valeur du stock (achat)" value={formatGNF(stockValuation.totalCostValue)} icon={Package} accent="accent" hint={`${stockValuation.totalUnits} unités`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Chiffre d&apos;affaires</CardTitle></CardHeader>
          <CardContent><RevenueChart data={revenueSeries} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Produits les plus vendus</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length ? <TopProductsChart data={topProducts} /> : <EmptyState icon={Package} title="Pas de ventes sur la période" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Produits les moins vendus</CardTitle></CardHeader>
          <CardContent>
            {leastSold.length === 0 ? (
              <EmptyState icon={Package} title="Pas assez de données" />
            ) : (
              <div className="space-y-2">
                {leastSold.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-muted-foreground">{p.name}</span>
                    <Badge variant="neutral">{p.quantity} vendu(s)</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Répartition des paiements</CardTitle></CardHeader>
          <CardContent>
            {paymentBreakdown.length === 0 ? (
              <EmptyState icon={Wallet} title="Aucun paiement" />
            ) : (
              <div className="space-y-3">
                {paymentBreakdown.map((p) => (
                  <div key={p.method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{p.method.replace("_", " ")}</span>
                      <span className="font-medium">{formatGNF(p.amount)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(p.amount / maxPayment) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4" /> Performance des employés</CardTitle></CardHeader>
          <CardContent>
            {employeePerf.length === 0 ? (
              <EmptyState icon={BarChart3} title="Aucune vente en caisse" />
            ) : (
              <div className="space-y-2">
                {employeePerf.map((e) => (
                  <div key={e.name} className="flex items-center justify-between text-sm">
                    <span>{e.name}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="neutral">{e.sales} vente(s)</Badge>
                      <span className="font-medium">{formatGNF(e.revenue)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Meilleurs clients</CardTitle></CardHeader>
          <CardContent>
            {customerInsights.topSpenders.length === 0 ? (
              <EmptyState icon={Users} title="Aucun client sur la période" />
            ) : (
              <div className="space-y-2">
                {customerInsights.topSpenders.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="font-medium">{formatGNF(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
