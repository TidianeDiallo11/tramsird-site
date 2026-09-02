import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const settings = await prisma.storeSettings.findFirst();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Informations générales de votre commerce</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Boutique</CardTitle>
          <CardDescription>Ces informations apparaissent sur les reçus et dans la boutique en ligne.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            settings={{
              name: settings?.name ?? "ShopFlow",
              phone: settings?.phone ?? null,
              email: settings?.email ?? null,
              address: settings?.address ?? null,
              logoUrl: settings?.logoUrl ?? null,
              taxRatePct: settings?.taxRatePct ?? 0,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
          <div>
            <CardTitle>Moyens de paiement</CardTitle>
            <CardDescription>
              Les clés API des opérateurs Mobile Money et prestataires de paiement (Orange Money, MTN MoMo, carte
              bancaire) se configurent exclusivement via les variables d&apos;environnement du serveur, pour ne
              jamais exposer de secret côté client. Voir <code className="rounded bg-surface-muted px-1">.env.example</code>.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
