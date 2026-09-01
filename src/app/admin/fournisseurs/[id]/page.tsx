import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatGNF } from "@/lib/utils";
import { SupplierFormDialog } from "../supplier-form-dialog";
import { PurchaseOrderDialog } from "./purchase-order-dialog";
import { ReceiveButton } from "./receive-button";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("suppliers.view");
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: true,
      purchaseOrders: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } },
    },
  });
  if (!supplier) notFound();

  const locations = await prisma.storageLocation.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">{supplier.phone} {supplier.email ? `· ${supplier.email}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <SupplierFormDialog values={supplier} trigger={<button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-4 text-sm font-medium hover:bg-surface-muted"><Pencil className="size-3.5" /> Modifier</button>} />
          <PurchaseOrderDialog supplierId={supplier.id} products={supplier.products.map((p) => ({ id: p.id, name: p.name, costPrice: p.costPrice }))} />
        </div>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Produits fournis ({supplier.products.length})</h2>
        <div className="flex flex-wrap gap-2">
          {supplier.products.map((p) => <Badge key={p.id} variant="neutral">{p.name}</Badge>)}
          {supplier.products.length === 0 && <p className="text-sm text-muted-foreground">Aucun produit associé.</p>}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 px-1 font-semibold">Historique des commandes de réapprovisionnement</h2>
        {supplier.purchaseOrders.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Aucune commande.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="text-muted-foreground">{formatDate(po.createdAt)}</TableCell>
                  <TableCell>{po.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}</TableCell>
                  <TableCell className="font-medium">{formatGNF(po.totalCost)}</TableCell>
                  <TableCell><StatusBadge status={po.status} type="purchaseOrder" /></TableCell>
                  <TableCell>{po.status === "ORDERED" && <ReceiveButton purchaseOrderId={po.id} locations={locations} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
