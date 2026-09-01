import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatGNF } from "@/lib/utils";
import { OrderFilters } from "./filters";

export const metadata: Metadata = { title: "Commandes" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; canal?: string }>;
}) {
  await requirePermission("orders.view");
  const { statut, canal } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(statut ? { status: statut as never } : {}),
      ...(canal ? { channel: canal as never } : {}),
    },
    include: { customer: true, items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Commandes</h1>
        <p className="text-sm text-muted-foreground">{orders.length} commande(s)</p>
      </div>

      <OrderFilters />

      <Card className="p-4">
        {orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Aucune commande" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-surface-muted">
                  <TableCell>
                    <Link href={`/admin/commandes/${order.id}`} className="font-medium text-brand hover:underline">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customer?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant={order.channel === "POS" ? "accent" : "info"}>{order.channel}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{order.items.length}</TableCell>
                  <TableCell className="font-medium">{formatGNF(order.total)}</TableCell>
                  <TableCell>{order.payments[0] ? <StatusBadge status={order.payments[0].status} type="payment" /> : "—"}</TableCell>
                  <TableCell><StatusBadge status={order.status} type="order" /></TableCell>
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
