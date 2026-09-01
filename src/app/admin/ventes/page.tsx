import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatGNF } from "@/lib/utils";

export const metadata: Metadata = { title: "Ventes" };

const PAID_STATUSES = ["PAID", "PREPARING", "READY", "SHIPPED", "DELIVERED"] as const;

export default async function SalesPage() {
  await requirePermission("reports.view");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay.getTime() - 6 * 86400000);

  const [salesToday, salesWeek, allSales, posCount, onlineCount] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: startOfDay }, status: { in: [...PAID_STATUSES] } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { createdAt: { gte: startOfWeek }, status: { in: [...PAID_STATUSES] } }, _sum: { total: true }, _count: true }),
    prisma.order.findMany({
      where: { status: { in: [...PAID_STATUSES] } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { customer: true, employee: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.order.count({ where: { channel: "POS", status: { in: [...PAID_STATUSES] } } }),
    prisma.order.count({ where: { channel: "ONLINE", status: { in: [...PAID_STATUSES] } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Ventes</h1>
        <p className="text-sm text-muted-foreground">Suivi des ventes en boutique et en ligne</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="CA aujourd'hui" value={formatGNF(salesToday._sum.total ?? 0)} icon={TrendingUp} hint={`${salesToday._count} vente(s)`} />
        <StatCard label="CA cette semaine" value={formatGNF(salesWeek._sum.total ?? 0)} hint={`${salesWeek._count} vente(s)`} accent="info" />
        <StatCard label="Ventes en caisse (POS)" value={posCount} accent="accent" />
        <StatCard label="Ventes en ligne" value={onlineCount} accent="success" />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 px-1 font-semibold">Ventes récentes</h2>
        {allSales.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Aucune vente" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Vendeur</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSales.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/commandes/${order.id}`} className="font-medium text-brand hover:underline">{order.orderNumber}</Link>
                  </TableCell>
                  <TableCell><Badge variant={order.channel === "POS" ? "accent" : "info"}>{order.channel}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{order.customer?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{order.employee?.name ?? "—"}</TableCell>
                  <TableCell>{order.payments[0] ? <StatusBadge status={order.payments[0].status} type="payment" /> : "—"}</TableCell>
                  <TableCell className="font-medium">{formatGNF(order.total)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
