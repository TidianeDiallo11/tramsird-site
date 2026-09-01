import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, MapPin, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate, formatGNF } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("customers.view");
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
      favorites: { include: { product: true } },
    },
  });
  if (!customer) notFound();

  const validOrders = customer.orders.filter((o) => o.status !== "CANCELLED");
  const totalSpent = validOrders.reduce((s, o) => s + o.total, 0);
  const avgBasket = validOrders.length ? Math.round(totalSpent / validOrders.length) : 0;

  const productCounts = new Map<string, { name: string; count: number }>();
  for (const order of validOrders) {
    for (const item of order.items) {
      const entry = productCounts.get(item.productId) ?? { name: item.nameSnapshot, count: 0 };
      entry.count += item.quantity;
      productCounts.set(item.productId, entry);
    }
  }
  const topProducts = [...productCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{customer.name}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Phone className="size-3.5" /> {customer.phone}</span>
          {customer.email && <span className="flex items-center gap-1"><Mail className="size-3.5" /> {customer.email}</span>}
          <span>Client depuis {formatDate(customer.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Commandes" value={customer.orders.length} />
        <StatCard label="Total dépensé" value={formatGNF(totalSpent)} accent="success" />
        <StatCard label="Panier moyen" value={formatGNF(avgBasket)} accent="info" />
        <StatCard label="Points fidélité" value={customer.loyaltyPoints} icon={Star} accent="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Historique des commandes</h2>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune commande.</p>
          ) : (
            <div className="space-y-2">
              {customer.orders.map((order) => (
                <Link key={order.id} href={`/admin/commandes/${order.id}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-surface-muted">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatGNF(order.total)}</span>
                    <StatusBadge status={order.status} type="order" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-2 p-5">
            <h2 className="flex items-center gap-1.5 font-semibold"><MapPin className="size-4" /> Adresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune adresse enregistrée.</p>
            ) : (
              customer.addresses.map((a) => (
                <p key={a.id} className="text-sm text-muted-foreground">{a.fullAddress}, {a.city}</p>
              ))
            )}
          </Card>

          <Card className="space-y-2 p-5">
            <h2 className="font-semibold">Produits préférés</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore d&apos;achats.</p>
            ) : (
              topProducts.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{p.name}</span>
                  <Badge variant="neutral">×{p.count}</Badge>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
