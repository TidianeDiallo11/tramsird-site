import { notFound } from "next/navigation";
import Image from "next/image";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { formatGNF, formatDateTime } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const session = await requireCustomer();

  const order = await prisma.order.findFirst({
    where: { orderNumber: numero, customerId: session.sub },
    include: {
      items: { include: { product: { include: { images: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      address: true,
      shipment: { include: { zone: true } },
    },
  });

  if (!order) notFound();

  const lastPayment = order.payments[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} type="order" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Suivi de commande</h2>
          <OrderTimeline currentStatus={order.status} history={order.statusHistory} />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <h2 className="font-semibold">Paiement</h2>
            {lastPayment ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{lastPayment.method.replace("_", " ")}</span>
                <StatusBadge status={lastPayment.status} type="payment" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
            )}
          </Card>

          {order.shipment && (
            <Card className="space-y-1 p-5 text-sm">
              <h2 className="font-semibold">Livraison</h2>
              <p className="text-muted-foreground">
                {order.shipment.zone?.name ?? "—"} · {order.address?.fullAddress}, {order.address?.city}
              </p>
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
                {item.product.images[0] && (
                  <Image src={item.product.images[0].url} alt="" fill sizes="56px" className="object-cover" />
                )}
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
