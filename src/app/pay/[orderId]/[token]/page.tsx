import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shop/logo";
import { formatGNF } from "@/lib/utils";
import { PayMethods } from "./pay-methods";

export const metadata = { title: "Paiement sécurisé" };

export default async function PayPage({
  params,
}: {
  params: Promise<{ orderId: string; token: string }>;
}) {
  const { orderId, token } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  const qrPayment = order?.payments.find((p) => p.qrToken === token);
  if (!order || !qrPayment) notFound();

  const alreadyPaid = order.status !== "NEW" && order.status !== "CANCELLED";
  const qrDataUrl = await QRCode.toDataURL(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pay/${orderId}/${token}`,
    { margin: 1, width: 220 },
  );

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo />
      <Card className="w-full space-y-5 p-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Commande {order.orderNumber}</p>
          <p className="text-3xl font-bold tracking-tight">{formatGNF(order.total)}</p>
        </div>

        {alreadyPaid ? (
          <div className="rounded-xl bg-success-soft p-4 text-success">
            Cette commande est déjà payée. Merci !
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Code de paiement" width={180} height={180} className="rounded-xl border border-border" />
            </div>
            <p className="text-xs text-muted-foreground">
              Scannez ce code avec votre téléphone ou choisissez un moyen de paiement ci-dessous.
            </p>
            <PayMethods orderId={order.id} />
          </>
        )}
      </Card>
    </main>
  );
}
