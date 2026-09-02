"use client";

import * as React from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateShipmentStatusAction } from "./actions";
import type { ShipmentStatus } from "@/generated/prisma/enums";

const OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: "PENDING", label: "En attente" },
  { value: "ASSIGNED", label: "Assignée" },
  { value: "IN_TRANSIT", label: "En route" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "FAILED", label: "Échec" },
];

export function ShipmentStatusSelect({ orderId, status }: { orderId: string; status: ShipmentStatus }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      value={status}
      onValueChange={(v) =>
        startTransition(async () => {
          await updateShipmentStatusAction(orderId, v as ShipmentStatus);
          toast.success("Statut de livraison mis à jour");
        })
      }
      disabled={pending}
    >
      <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
