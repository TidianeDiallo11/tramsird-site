import type { Metadata } from "next";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { LoyaltyRuleForm } from "./rule-form";

export const metadata: Metadata = { title: "Fidélité" };

export default async function LoyaltyPage() {
  await requirePermission("loyalty.manage");

  const [rule, transactions, topCustomers] = await Promise.all([
    prisma.loyaltyRule.findFirst(),
    prisma.loyaltyTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { customer: true, order: true },
    }),
    prisma.customer.findMany({ orderBy: { loyaltyPoints: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Fidélité</h1>
        <p className="text-sm text-muted-foreground">Programme de points pour récompenser vos meilleurs clients</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Règle de calcul</CardTitle></CardHeader>
        <CardContent>
          <LoyaltyRuleForm gnfPerPoint={rule?.gnfPerPoint ?? 10000} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          <h2 className="mb-3 px-1 font-semibold">Transactions récentes</h2>
          {transactions.length === 0 ? (
            <EmptyState icon={Star} title="Aucune transaction" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Commande</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.order?.orderNumber ?? "—"}</TableCell>
                    <TableCell><Badge variant={t.type === "EARN" ? "success" : "warning"}>{t.type === "EARN" ? "+" : "-"}{t.points}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 px-1 font-semibold">Top clients fidèles</h2>
          <div className="space-y-2">
            {topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl px-2 py-1.5">
                <span className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">#{i + 1}</span> {c.name}</span>
                <Badge variant="accent">{c.loyaltyPoints} pts</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
