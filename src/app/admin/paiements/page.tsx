import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatGNF } from "@/lib/utils";
import { isMethodConfigured } from "@/lib/payments/payment-service";
import type { PaymentMethod } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Paiements" };

const METHODS: PaymentMethod[] = ["CASH", "ORANGE_MONEY", "MTN_MOMO", "OTHER_MOMO", "CARD", "BANK_TRANSFER", "QR_CODE"];

export default async function PaymentsPage() {
  await requirePermission("payments.view");

  const [payments, succeeded, pending, failed] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { order: { include: { customer: true } } },
    }),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true }, _count: true }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Paiements</h1>
        <p className="text-sm text-muted-foreground">Transactions et état des moyens de paiement</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total encaissé" value={formatGNF(succeeded._sum.amount ?? 0)} accent="success" hint={`${succeeded._count} paiement(s) réussis`} />
        <StatCard label="En attente" value={pending} accent="info" />
        <StatCard label="Échoués / refusés" value={failed} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 px-1 font-semibold">État des moyens de paiement</h2>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => {
            const configured = isMethodConfigured(m);
            return (
              <Badge key={m} variant={configured ? "success" : "neutral"}>
                {m.replace("_", " ")} — {configured ? "Configuré" : "Clés API manquantes"}
              </Badge>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Les moyens marqués « clés API manquantes » refuseront tout paiement réel tant que leurs identifiants ne
          sont pas renseignés dans les variables d&apos;environnement du serveur (voir Paramètres).
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 px-1 font-semibold">Transactions récentes</h2>
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="Aucun paiement" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/commandes/${p.orderId}`} className="font-medium text-brand hover:underline">{p.order.orderNumber}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.order.customer?.name ?? "—"}</TableCell>
                  <TableCell>{p.method.replace("_", " ")}</TableCell>
                  <TableCell className="font-medium">{formatGNF(p.amount)}</TableCell>
                  <TableCell><StatusBadge status={p.status} type="payment" /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
