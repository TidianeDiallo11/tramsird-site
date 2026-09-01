import type { Metadata } from "next";
import Image from "next/image";
import { Package, Pencil, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge, stockStatusFor } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatGNF } from "@/lib/utils";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductRowActions } from "./product-row-actions";

export const metadata: Metadata = { title: "Produits" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePermission("products.view");
  const { q } = await searchParams;
  const canEditPrice = hasPermission(session.role, "products.edit_price");
  const canEdit = hasPermission(session.role, "products.edit");
  const canDelete = hasPermission(session.role, "products.delete");

  const [products, categories, brands, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }
        : undefined,
      include: { category: true, brand: true, images: { orderBy: { position: "asc" }, take: 1 }, inventory: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Produits</h1>
          <p className="text-sm text-muted-foreground">{products.length} produit(s)</p>
        </div>
        {canEdit && (
          <ProductFormDialog categories={categories} brands={brands} suppliers={suppliers} canEditPrice={canEditPrice} />
        )}
      </div>

      <form className="max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Rechercher un produit, SKU…" className="pl-10" />
        </div>
      </form>

      <Card className="p-4">
        {products.length === 0 ? (
          <EmptyState icon={Package} title="Aucun produit" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const stock = p.inventory.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                          {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.category.name}</TableCell>
                    <TableCell>
                      {canEditPrice ? (
                        <>
                          {formatGNF(p.promoPrice ?? p.sellingPrice)}
                          {p.promoPrice && (
                            <span className="ml-1.5 text-xs text-muted-foreground line-through">{formatGNF(p.sellingPrice)}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{stock}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={stockStatusFor(stock, p.lowStockThreshold)} type="stock" />
                        {!p.active && <Badge variant="neutral">Désactivé</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {canEdit && (
                          <ProductFormDialog
                            categories={categories}
                            brands={brands}
                            suppliers={suppliers}
                            canEditPrice={canEditPrice}
                            values={{
                              id: p.id,
                              name: p.name,
                              categoryId: p.categoryId,
                              brandId: p.brandId,
                              supplierId: p.supplierId,
                              description: p.description,
                              costPrice: p.costPrice,
                              sellingPrice: p.sellingPrice,
                              promoPrice: p.promoPrice,
                              lowStockThreshold: p.lowStockThreshold,
                              featured: p.featured,
                            }}
                            trigger={
                              <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted cursor-pointer">
                                <Pencil className="size-4" />
                              </button>
                            }
                          />
                        )}
                        <ProductRowActions
                          productId={p.id}
                          active={p.active}
                          canEdit={canEdit}
                          canDelete={canDelete}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
