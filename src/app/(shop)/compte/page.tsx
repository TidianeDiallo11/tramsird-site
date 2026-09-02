import Link from "next/link";
import { Package, Star, MapPin, Heart } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatGNF } from "@/lib/utils";

export default async function AccountHomePage() {
  const session = await requireCustomer();
  const customer = await prisma.customer.findUnique({
    where: { id: session.sub },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: { select: { orders: true, favorites: true, addresses: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMini icon={Package} label="Commandes" value={customer?._count.orders ?? 0} />
        <StatMini icon={Star} label="Points fidélité" value={customer?.loyaltyPoints ?? 0} />
        <StatMini icon={Heart} label="Favoris" value={customer?._count.favorites ?? 0} />
        <StatMini icon={MapPin} label="Adresses" value={customer?._count.addresses ?? 0} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Commandes récentes</h2>
          <Link href="/compte/commandes" className="text-sm text-brand hover:underline">Voir tout</Link>
        </div>
        <div className="space-y-2">
          {customer?.orders.length ? (
            customer.orders.map((order) => (
              <Link key={order.id} href={`/compte/commandes/${order.orderNumber}`}>
                <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatGNF(order.total)}</p>
                    <StatusBadge status={order.status} type="order" />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <Card className="flex flex-col items-center gap-1 p-4 text-center">
      <Icon className="size-5 text-brand" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}
