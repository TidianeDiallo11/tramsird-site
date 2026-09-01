import type { Metadata } from "next";
import Link from "next/link";
import { Users, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatGNF } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("customers.view");
  const { q } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }
      : undefined,
    include: { orders: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Clients</h1>
        <p className="text-sm text-muted-foreground">{customers.length} client(s)</p>
      </div>

      <form className="max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Nom ou téléphone…" className="pl-10" />
        </div>
      </form>

      <Card className="p-4">
        {customers.length === 0 ? (
          <EmptyState icon={Users} title="Aucun client" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Total dépensé</TableHead>
                <TableHead>Points fidélité</TableHead>
                <TableHead>Dernière commande</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const spent = c.orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);
                const last = c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/admin/clients/${c.id}`} className="font-medium text-brand hover:underline">{c.name}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell>{c.orders.length}</TableCell>
                    <TableCell className="font-medium">{formatGNF(spent)}</TableCell>
                    <TableCell><Badge variant="accent">{c.loyaltyPoints} pts</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{last ? formatDate(last.createdAt) : "—"}</TableCell>
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
