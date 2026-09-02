import Link from "next/link";
import { Package } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatGNF } from "@/lib/utils";

export const metadata = { title: "Mes commandes" };

export default async function OrdersPage() {
  const session = await requireCustomer();
  const orders = await prisma.order.findMany({
    where: { customerId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucune commande"
        description="Vos commandes passées apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link key={order.id} href={`/compte/commandes/${order.orderNumber}`}>
          <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand">
            <div>
              <p className="font-medium">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)} · {order.items.length} article{order.items.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatGNF(order.total)}</p>
              <StatusBadge status={order.status} type="order" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
