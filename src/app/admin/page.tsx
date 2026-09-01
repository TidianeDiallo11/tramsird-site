import Link from "next/link";
import type { Metadata } from "next";
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { getStaffSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import {
  resolvePeriod,
  getDashboardStats,
  getRevenueSeries,
  getTopProducts,
  getLowStockProducts,
  getRecentOrders,
  getRecentPayments,
  type PeriodKey,
} from "@/lib/data/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PeriodSelector } from "@/components/admin/period-selector";
import { RevenueChart, TopProductsChart } from "@/components/admin/charts";
import { formatGNF, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const sp = await searchParams;
  const session = await getStaffSession();
  const canSeeProfit = session ? hasPermission(session.role, "reports.view_profit") : false;
  const period = (sp.periode as PeriodKey) ?? "30d";
  const { from, to } = resolvePeriod(period);

  const [stats, revenueSeries, topProducts, lowStock, recentOrders, recentPayments] = await Promise.all([
    getDashboardStats(from, to),
    getRevenueSeries(from, to),
    getTopProducts(from, to),
    getLowStockProducts(),
    getRecentOrders(),
    getRecentPayments(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre activité</p>
        </div>
        <PeriodSelector />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={formatGNF(stats.revenue)}
          icon={DollarSign}
          trend={{ value: stats.revenueTrend, label: "vs période précédente" }}
        />
        <StatCard
          label="Commandes"
          value={stats.orderCount}
          icon={ShoppingCart}
          trend={{ value: stats.orderCountTrend, label: "vs période précédente" }}
          accent="info"
        />
        <StatCard
          label="Produits vendus"
          value={stats.unitsSold}
          icon={Package}
          trend={{ value: stats.unitsSoldTrend, label: "vs période précédente" }}
          accent="accent"
        />
        {canSeeProfit ? (
          <StatCard
            label="Bénéfice estimé"
            value={formatGNF(stats.profit)}
            icon={TrendingUp}
            trend={{ value: stats.profitTrend, label: "vs période précédente" }}
            accent="success"
          />
        ) : (
          <StatCard label="Bénéfice estimé" value="Non autorisé" icon={TrendingUp} hint="Réservé aux managers" />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d&apos;affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length ? (
              <TopProductsChart data={topProducts} />
            ) : (
              <EmptyState icon={Package} title="Pas encore de ventes sur cette période" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Commandes récentes</CardTitle>
            <Link href="/admin/commandes" className="text-sm font-medium text-brand hover:underline">Voir tout</Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.name ?? "Client"} · {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatGNF(order.total)}</span>
                      <StatusBadge status={order.status} type="order" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ShoppingCart} title="Aucune commande" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" /> Stock faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length ? (
              <div className="space-y-3">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <StatusBadge status={p.stock <= 0 ? "OUT" : "LOW"} type="stock" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tout le stock est à un niveau sain.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paiements récents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPayments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Commande</th>
                    <th className="pb-2 font-medium">Méthode</th>
                    <th className="pb-2 font-medium">Montant</th>
                    <th className="pb-2 font-medium">Statut</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-medium">{p.order.orderNumber}</td>
                      <td className="py-2 text-muted-foreground">{p.method.replace("_", " ")}</td>
                      <td className="py-2">{formatGNF(p.amount)}</td>
                      <td className="py-2"><StatusBadge status={p.status} type="payment" /></td>
                      <td className="py-2 text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={DollarSign} title="Aucun paiement" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
