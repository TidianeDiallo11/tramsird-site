"use client";

import * as React from "react";
import { Check, Printer, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn, formatGNF } from "@/lib/utils";
import { checkoutPosAction, type PosCartItem } from "./actions";
import type { PaymentMethod } from "@/generated/prisma/enums";

const METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "CASH", label: "Espèces", icon: "💵" },
  { value: "ORANGE_MONEY", label: "Orange Money", icon: "🟠" },
  { value: "MTN_MOMO", label: "MTN Mobile Money", icon: "🟡" },
  { value: "OTHER_MOMO", label: "Autre Mobile Money", icon: "📱" },
  { value: "CARD", label: "Carte bancaire", icon: "💳" },
  { value: "BANK_TRANSFER", label: "Virement bancaire", icon: "🏦" },
  { value: "QR_CODE", label: "QR Code", icon: "🔲" },
  { value: "MIXED", label: "Paiement mixte", icon: "➕" },
];

export function PaymentDialog({
  open,
  onOpenChange,
  items,
  discount,
  total,
  customerPhone,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PosCartItem[];
  discount: number;
  total: number;
  customerPhone: string;
  onSuccess: () => void;
}) {
  const [method, setMethod] = React.useState<PaymentMethod>("CASH");
  const [secondMethod, setSecondMethod] = React.useState<PaymentMethod>("ORANGE_MONEY");
  const [cashSplit, setCashSplit] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [receipt, setReceipt] = React.useState<{ orderId: string; orderNumber: string; message: string; status: string } | null>(null);

  React.useEffect(() => {
    // Réinitialise le formulaire de paiement à chaque ouverture du dialogue.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setMethod("CASH");
      setReceipt(null);
      setCashSplit(Math.round(total / 2));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, total]);

  async function submit() {
    setPending(true);
    try {
      const result = await checkoutPosAction({
        items,
        discount,
        paymentMethod: method,
        customerPhone: customerPhone || undefined,
        cashSplitAmount: method === "MIXED" ? cashSplit : undefined,
        secondMethod: method === "MIXED" ? secondMethod : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReceipt({ orderId: result.orderId, orderNumber: result.orderNumber, message: result.message, status: result.paymentStatus });
      if (result.paymentStatus === "SUCCEEDED") toast.success("Vente encaissée");
      else toast.info(result.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o && receipt) onSuccess(); }}>
      <DialogContent>
        {receipt ? (
          <div className="space-y-4 text-center">
            <div className={cn(
              "mx-auto flex size-14 items-center justify-center rounded-full",
              receipt.status === "SUCCEEDED" ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
            )}>
              <Check className="size-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Commande {receipt.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">{receipt.message}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`/api/receipts/${receipt.orderId}`, "_blank")}>
                <Printer className="size-4" /> Reçu
              </Button>
              <Button className="flex-1" onClick={() => { onOpenChange(false); onSuccess(); }}>Nouvelle vente</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Encaisser — {formatGNF(total)}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm",
                    method === m.value ? "border-brand bg-brand-soft" : "border-border",
                  )}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>

            {method === "MIXED" && (
              <div className="space-y-3 rounded-xl bg-surface-muted p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cashSplit">Montant en espèces (GNF)</Label>
                  <Input id="cashSplit" type="number" value={cashSplit} onChange={(e) => setCashSplit(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reste à payer par</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["ORANGE_MONEY", "MTN_MOMO", "CARD"] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSecondMethod(m)}
                        className={cn("rounded-lg border px-2 py-1.5 text-xs", secondMethod === m ? "border-brand bg-brand-soft" : "border-border")}
                      >
                        {m.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Reste : {formatGNF(Math.max(0, total - cashSplit))}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button onClick={submit} loading={pending} className="gap-2">
                <Receipt className="size-4" /> Confirmer le paiement
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
