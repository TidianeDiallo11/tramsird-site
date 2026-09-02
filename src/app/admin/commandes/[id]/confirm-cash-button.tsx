"use client";

import * as React from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmCashReceivedAction } from "../actions";

export function ConfirmCashButton({ paymentId }: { paymentId: string }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          await confirmCashReceivedAction(paymentId);
          toast.success("Paiement en espèces confirmé");
        })
      }
    >
      <Wallet className="size-4" /> Confirmer réception espèces
    </Button>
  );
}
