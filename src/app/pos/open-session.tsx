"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shop/logo";
import { openPosSessionAction } from "./actions";

export function OpenSessionScreen({
  storeName,
  logoUrl,
}: {
  storeName?: string;
  logoUrl?: string | null;
}) {
  const [amount, setAmount] = React.useState("0");
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function submit() {
    setPending(true);
    try {
      await openPosSessionAction(Number(amount) || 0);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm space-y-5 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo name={storeName} logoUrl={logoUrl} />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
            <Wallet className="size-6" />
          </div>
          <div>
            <h1 className="font-bold">Ouvrir la caisse</h1>
            <p className="text-sm text-muted-foreground">Indiquez le fonds de caisse de départ</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="opening">Montant en espèces (GNF)</Label>
          <Input id="opening" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button className="w-full" loading={pending} onClick={submit}>
          Ouvrir la caisse
        </Button>
      </Card>
    </div>
  );
}
