import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shop/logo";
import { formatGNF } from "@/lib/utils";
import { getStoreBranding } from "@/lib/store-branding";

export const metadata = { title: "Résultat du paiement" };

export default async function PaymentCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ transactionId?: string; status?: string; cancelled?: string }>;
}) {
  const { orderId } = await params;
  const { transactionId, cancelled } = await searchParams;
  const branding = await getStoreBranding();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  if (!order) notFound();

  // On ne se fie jamais au seul orderId de l'URL, ni au paramètre `status`
  // de Djomy (non authentifié) : le statut affiché vient toujours de notre
  // base, confirmée par le webhook. `order.status` fait foi pour savoir si
  // la commande est réellement payée ; on ne cherche un paiement précis
  // (via `transactionId`) que pour distinguer échec / en cours.
  const orderIsPaid = order.status !== "NEW" && order.status !== "CANCELLED";
  const payment = transactionId ? order.payments.find((p) => p.providerReference === transactionId) : null;
  const wasCancelled = !orderIsPaid && cancelled === "1";

  let icon = <Clock className="size-7" />;
  let iconClass = "bg-brand-soft text-brand";
  let title = "Vérification du paiement en cours…";
  let description = "Nous confirmons votre paiement avec le prestataire. Cela ne prend généralement que quelques instants.";

  if (orderIsPaid) {
    icon = <CheckCircle2 className="size-7" />;
    iconClass = "bg-success-soft text-success";
    title = "Paiement réussi";
    description = "Merci ! Votre commande est confirmée.";
  } else if (wasCancelled) {
    icon = <Ban className="size-7" />;
    iconClass = "bg-surface-muted text-muted-foreground";
    title = "Paiement annulé";
    description = "Vous avez annulé le paiement avant de le finaliser. Votre commande reste enregistrée.";
  } else if (payment?.status === "FAILED" || payment?.status === "CANCELLED") {
    icon = <XCircle className="size-7" />;
    iconClass = "bg-danger-soft text-danger";
    title = "Paiement échoué";
    description = "Le paiement n'a pas abouti. Vous pouvez réessayer ou choisir un autre moyen de paiement.";
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo name={branding.name} logoUrl={branding.logoUrl} />
      <Card className="w-full space-y-4 p-6 text-center">
        <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${iconClass}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">Commande {order.orderNumber}</p>
          <p className="text-2xl font-bold tracking-tight">{formatGNF(order.total)}</p>
        </div>
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-col gap-2 pt-2">
          {!orderIsPaid && (wasCancelled || payment?.status === "FAILED" || payment?.status === "CANCELLED") && (
            <Button asChild>
              <Link href="/checkout">Réessayer le paiement</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/">Retour à la boutique</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
