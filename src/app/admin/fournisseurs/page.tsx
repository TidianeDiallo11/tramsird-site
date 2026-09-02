import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SupplierFormDialog } from "./supplier-form-dialog";

export const metadata: Metadata = { title: "Fournisseurs" };

export default async function SuppliersPage() {
  await requirePermission("suppliers.view");

  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true, purchaseOrders: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Fournisseurs</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} fournisseur(s)</p>
        </div>
        <SupplierFormDialog />
      </div>

      <Card className="p-4">
        {suppliers.length === 0 ? (
          <EmptyState icon={Truck} title="Aucun fournisseur" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead>Commandes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/admin/fournisseurs/${s.id}`} className="font-medium text-brand hover:underline">{s.name}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.phone ?? s.email ?? "—"}</TableCell>
                  <TableCell><Badge variant="neutral">{s._count.products}</Badge></TableCell>
                  <TableCell><Badge variant="neutral">{s._count.purchaseOrders}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
