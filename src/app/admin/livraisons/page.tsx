import type { Metadata } from "next";
import Link from "next/link";
import { Bike, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatGNF } from "@/lib/utils";
import { ZoneFormDialog } from "./zone-form-dialog";
import { ShipmentStatusSelect } from "./shipment-status-select";
import { ZoneToggle } from "./zone-toggle";

export const metadata: Metadata = { title: "Livraisons" };

export default async function DeliveryPage() {
  const session = await requirePermission("orders.view");
  const canManageZones = hasPermission(session.role, "delivery.manage");

  const [zones, shipments] = await Promise.all([
    prisma.deliveryZone.findMany({ orderBy: { name: "asc" } }),
    prisma.shipment.findMany({
      where: { status: { not: "DELIVERED" } },
      include: { order: { include: { customer: true, address: true } }, zone: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Livraisons</h1>
        <p className="text-sm text-muted-foreground">Zones, frais et suivi des livraisons en cours</p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-1.5 font-semibold"><MapPin className="size-4" /> Zones de livraison</h2>
          {canManageZones && <ZoneFormDialog />}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Frais</TableHead>
              <TableHead>Délai estimé</TableHead>
              <TableHead>Active</TableHead>
              {canManageZones && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((z) => (
              <TableRow key={z.id}>
                <TableCell className="font-medium">{z.name}</TableCell>
                <TableCell>{formatGNF(z.fee)}</TableCell>
                <TableCell className="text-muted-foreground">{z.estimatedDays} jour(s)</TableCell>
                <TableCell>{canManageZones ? <ZoneToggle zoneId={z.id} active={z.active} /> : <Badge variant={z.active ? "success" : "neutral"}>{z.active ? "Active" : "Inactive"}</Badge>}</TableCell>
                {canManageZones && (
                  <TableCell>
                    <ZoneFormDialog values={z} trigger={<button className="text-sm font-medium text-brand hover:underline">Modifier</button>} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 font-semibold"><Bike className="size-4" /> Livraisons en cours</h2>
        {shipments.length === 0 ? (
          <EmptyState icon={Bike} title="Aucune livraison en cours" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/admin/commandes/${s.orderId}`} className="font-medium text-brand hover:underline">{s.order.orderNumber}</Link>
                  </TableCell>
                  <TableCell>{s.order.customer?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.zone?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.order.address?.fullAddress ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                  <TableCell><ShipmentStatusSelect orderId={s.orderId} status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
