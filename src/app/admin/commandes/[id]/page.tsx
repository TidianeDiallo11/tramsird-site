import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Printer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { formatGNF, formatDateTime } from "@/lib/utils";
import { StatusUpdater } from "./status-updater";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("orders.view");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      customer: true,
      address: true,
      employee: true,
      shipment: { include: { zone: true } },
    },
  });
  if (!order) notFound();

  const canManage = hasPermission(session.role, "orders.manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)} · <Badge variant={order.channel === "POS" ? "accent" : "info"}>{order.channel}</Badge></p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={`/api/receipts/${order.id}`} target="_blank" rel="noreferrer"><Printer className="size-4" /> Reçu</a>
          </Button>
          {canManage && <StatusUpdater orderId={order.id} currentStatus={order.status} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Suivi</h2>
          <OrderTimeline currentStatus={order.status} history={order.statusHistory} />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold">Client</h2>
            {order.customer ? (
              <>
                <Link href={`/admin/clients/${order.customer.id}`} className="font-medium text-brand hover:underline">{order.customer.name}</Link>
                <p className="text-muted-foreground">{order.customer.phone}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Client anonyme</p>
            )}
            {order.employee && <p className="text-muted-foreground">Vendu par {order.employee.name}</p>}
          </Card>

          <Card className="space-y-2 p-5 text-sm">
            <h2 className="font-semibold">Paiement</h2>
            {order.payments.length === 0 ? (
              <p className="text-muted-foreground">Aucun paiement</p>
            ) : (
              order.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{p.method.replace("_", " ")}</span>
                  <StatusBadge status={p.status} type="payment" />
                </div>
              ))
            )}
          </Card>

          {order.shipment && (
            <Card className="space-y-1 p-5 text-sm">
              <h2 className="font-semibold">Livraison</h2>
              <p className="text-muted-foreground">{order.shipment.zone?.name ?? "—"}</p>
              <p className="text-muted-foreground">{order.address?.fullAddress}, {order.address?.city}</p>
              <StatusBadge status={order.shipment.status} type="shipment" />
            </Card>
          )}
        </div>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Articles</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                {item.product.images[0] && <Image src={item.product.images[0].url} alt="" fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.nameSnapshot}</p>
                <p className="text-xs text-muted-foreground">{item.quantity} × {formatGNF(item.unitPrice)}</p>
              </div>
              <p className="font-semibold">{formatGNF(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatGNF(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span>-{formatGNF(order.discount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Livraison</span><span>{formatGNF(order.deliveryFee)}</span></div>
          <div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span>{formatGNF(order.total)}</span></div>
        </div>
      </Card>
    </div>
  );
}
