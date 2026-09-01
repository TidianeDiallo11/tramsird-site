"use client";

import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { receivePurchaseOrderAction } from "../actions";

export function ReceiveButton({ purchaseOrderId, locations }: { purchaseOrderId: string; locations: { id: string; code: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [locationId, setLocationId] = React.useState(locations[0]?.id ?? "");
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Réceptionner</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Réceptionner la commande</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Emplacement de rangement</label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  await receivePurchaseOrderAction(purchaseOrderId, locationId);
                  toast.success("Stock mis à jour");
                  setOpen(false);
                })
              }
            >
              Confirmer la réception
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
