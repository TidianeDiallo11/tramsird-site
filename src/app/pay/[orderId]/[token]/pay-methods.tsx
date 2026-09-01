"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PaymentMethod } from "@/generated/prisma/enums";
import { payWithMethodAction } from "./actions";

const METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "ORANGE_MONEY", label: "Orange Money", icon: "🟠" },
  { value: "MTN_MOMO", label: "MTN Mobile Money", icon: "🟡" },
  { value: "CARD", label: "Carte bancaire", icon: "💳" },
];

export function PayMethods({ orderId }: { orderId: string }) {
  const [loading, setLoading] = React.useState<PaymentMethod | null>(null);

  async function pay(method: PaymentMethod) {
    setLoading(method);
    try {
      const res = await payWithMethodAction(orderId, method);
      if (res.status === "SUCCEEDED") {
        toast.success("Paiement confirmé !");
      } else {
        toast.info(res.message);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {METHODS.map((m) => (
        <Button
          key={m.value}
          variant="outline"
          className="w-full justify-start gap-3"
          loading={loading === m.value}
          onClick={() => pay(m.value)}
        >
          <span>{m.icon}</span>
          Payer avec {m.label}
        </Button>
      ))}
    </div>
  );
}
