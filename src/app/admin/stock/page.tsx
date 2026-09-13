import type { Metadata } from "next";
import { Boxes, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { getStockByProductIds } from "@/lib/data/catalog";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge, stockStatusFor } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { StockAdjustDialog } from "./stock-adjust-dialog";

export const metadata: Metadata = { title: "Stock" };

const MOVEMENT_LABELS: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  ADJUSTMENT: "Correction",
  TRANSFER: "Transfert",
  RETURN: "Retour",
  RESTOCK: "Réappro.",
  SALE: "Vente",
};

export default async function StockPage() {
  await requirePermission("stock.view");

  const [products, locations, movements] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        sku: true,
        lowStockThreshold: true,
        variants: { select: { id: true, size: true, color: true, sku: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.storageLocation.findMany({ orderBy: { code: "asc" } }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        type: true,
        quantity: true,
        product: { select: { name: true } },
        variant: { select: { size: true, color: true } },
        location: { select: { code: true } },
        user: { select: { name: true } },
      },
    }),
  ]);
  const stockByProduct = await getStockByProductIds(products.map((p) => p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Stock</h1>
        <p className="text-sm text-muted-foreground">Suivi de l&apos;inventaire et alertes de rupture</p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Boxes className="size-4" /> Niveaux de stock</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock total</TableHead>
              <TableHead>Seuil</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const stock = stockByProduct.get(p.id) ?? 0;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                  <TableCell>{stock}</TableCell>
                  <TableCell className="text-muted-foreground">{p.lowStockThreshold}</TableCell>
                  <TableCell><StatusBadge status={stockStatusFor(stock, p.lowStockThreshold)} type="stock" /></TableCell>
                  <TableCell>
                    <StockAdjustDialog
                      productId={p.id}
                      productName={p.name}
                      variants={p.variants.map((v) => ({ id: v.id, label: [v.size, v.color].filter(Boolean).join(" ") || v.sku }))}
                      locations={locations.map((l) => ({ id: l.id, code: l.code }))}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><History className="size-4" /> Historique des mouvements</h2>
        {movements.length === 0 ? (
          <EmptyState icon={History} title="Aucun mouvement enregistré" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Emplacement</TableHead>
                <TableHead>Par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground">{formatDateTime(m.createdAt)}</TableCell>
                  <TableCell>{m.product.name}{m.variant ? ` (${[m.variant.size, m.variant.color].filter(Boolean).join(" ")})` : ""}</TableCell>
                  <TableCell>{MOVEMENT_LABELS[m.type] ?? m.type}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{m.location?.code ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{m.user?.name ?? "Système"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
