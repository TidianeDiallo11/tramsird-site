import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";
import { CheckoutWizard } from "./checkout-wizard";

export const metadata: Metadata = { title: "Finaliser la commande" };

export default async function CheckoutPage() {
  const [zones, session] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { active: true }, orderBy: { fee: "asc" } }),
    getCustomerSession(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-bold">Finaliser la commande</h1>
      <CheckoutWizard zones={zones} defaultName={session?.name} defaultPhone={session?.phone} />
    </div>
  );
}
