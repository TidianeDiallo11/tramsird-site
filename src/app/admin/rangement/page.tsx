import type { Metadata } from "next";
import Link from "next/link";
import { Warehouse, ScanLine, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Rangement" };

export default async function RangementPage() {
  await requirePermission("stock.view");

  const warehouses = await prisma.warehouse.findMany({
    include: {
      locations: {
        orderBy: { code: "asc" },
        include: { inventory: { include: { product: true, variant: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Rangement</h1>
          <p className="text-sm text-muted-foreground">Emplacements physiques de vos produits en entrepôt</p>
        </div>
        <Link href="/admin/rangement/scanner">
          <Button variant="outline" className="gap-2"><ScanLine className="size-4" /> Scanner un code-barres</Button>
        </Link>
      </div>

      {warehouses.length === 0 ? (
        <EmptyState icon={Warehouse} title="Aucun entrepôt configuré" />
      ) : (
        warehouses.map((wh) => (
          <div key={wh.id} className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Warehouse className="size-4 text-brand" /> {wh.name}
              {wh.isDefault && <Badge variant="default">Principal</Badge>}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wh.locations.map((loc) => {
                const totalQty = loc.inventory.reduce((s, i) => s + i.quantity, 0);
                const lowCount = loc.inventory.filter((i) => i.product.lowStockThreshold >= i.quantity && i.quantity > 0).length;
                const outCount = loc.inventory.filter((i) => i.quantity <= 0).length;
                return (
                  <Card key={loc.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm font-semibold">{loc.code}</p>
                      <Badge variant="neutral">{totalQty} art.</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{loc.aisle} · {loc.shelf} · {loc.level}</p>
                    <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                      {loc.inventory.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Emplacement vide</p>
                      ) : (
                        loc.inventory.slice(0, 4).map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between text-xs">
                            <span className="truncate text-muted-foreground">{inv.product.name}</span>
                            <span className="shrink-0 font-medium">{inv.quantity}</span>
                          </div>
                        ))
                      )}
                      {loc.inventory.length > 4 && (
                        <p className="text-xs text-muted-foreground">+{loc.inventory.length - 4} autre(s)</p>
                      )}
                    </div>
                    {(lowCount > 0 || outCount > 0) && (
                      <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
                        {outCount > 0 && <Badge variant="danger">{outCount} en rupture</Badge>}
                        {lowCount > 0 && <Badge variant="warning">{lowCount} faible(s)</Badge>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Card className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
        <Package className="size-4 shrink-0" />
        Astuce : utilisez le scanner de code-barres pour retrouver instantanément l&apos;emplacement d&apos;un produit
        lors d&apos;un réapprovisionnement ou d&apos;un inventaire.
      </Card>
    </div>
  );
}
