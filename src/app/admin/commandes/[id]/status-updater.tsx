"use client";

import * as React from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateOrderStatusAction } from "../actions";
import type { OrderStatus } from "@/generated/prisma/enums";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "NEW", label: "Nouvelle" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "PAID", label: "Payée" },
  { value: "PREPARING", label: "En préparation" },
  { value: "READY", label: "Prête" },
  { value: "SHIPPED", label: "Expédiée" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "CANCELLED", label: "Annulée" },
];

export function StatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const [value, setValue] = React.useState<OrderStatus>(currentStatus);
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={(v) => setValue(v as OrderStatus)}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={value === currentStatus}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            await updateOrderStatusAction(orderId, value);
            toast.success("Statut mis à jour");
          })
        }
      >
        Mettre à jour
      </Button>
    </div>
  );
}
