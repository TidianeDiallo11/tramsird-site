import type { Metadata } from "next";
import { Percent } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { PromotionFormDialog } from "./promotion-form-dialog";
import { PromotionActionsMenu } from "./promotion-actions-menu";

export const metadata: Metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  await requirePermission("promotions.manage");

  const [promotions, products, categories] = await Promise.all([
    prisma.promotion.findMany({
      include: { product: true, category: true, coupons: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Promotions</h1>
          <p className="text-sm text-muted-foreground">{promotions.length} promotion(s)</p>
        </div>
        <PromotionFormDialog products={products} categories={categories} />
      </div>

      <Card className="p-4">
        {promotions.length === 0 ? (
          <EmptyState icon={Percent} title="Aucune promotion" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Coupon</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.product?.name ?? p.category?.name ?? "—"}</TableCell>
                  <TableCell>{p.type === "PERCENT" ? `${p.value}%` : `${p.value} GNF`}</TableCell>
                  <TableCell>{p.coupons[0] ? <Badge variant="info">{p.coupons[0].code}</Badge> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.startDate)} → {formatDate(p.endDate)}</TableCell>
                  <TableCell><Badge variant={p.active ? "success" : "neutral"}>{p.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell><PromotionActionsMenu promotionId={p.id} active={p.active} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
