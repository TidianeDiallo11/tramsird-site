"use client";

import * as React from "react";
import { useActionState } from "react";
import { Boxes } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adjustStockAction, type StockFormState } from "./actions";

const TYPES = [
  { value: "IN", label: "Entrée de stock" },
  { value: "OUT", label: "Sortie de stock" },
  { value: "RESTOCK", label: "Réapprovisionnement" },
  { value: "RETURN", label: "Retour client" },
  { value: "ADJUSTMENT", label: "Correction (inventaire)" },
  { value: "TRANSFER", label: "Transfert entre emplacements" },
];

const initialState: StockFormState = {};

export function StockAdjustDialog({
  productId,
  productName,
  variants,
  locations,
  trigger,
}: {
  productId: string;
  productName: string;
  variants: { id: string; label: string }[];
  locations: { id: string; code: string }[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(adjustStockAction, initialState);
  const [type, setType] = React.useState("IN");
  const [locationId, setLocationId] = React.useState(locations[0]?.id ?? "");
  const [destinationId, setDestinationId] = React.useState("");
  const [variantId, setVariantId] = React.useState("");

  React.useEffect(() => {
    // Ferme le dialogue une fois la mutation confirmée par le serveur.

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline" className="gap-1.5"><Boxes className="size-4" /> Ajuster</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuster le stock — {productName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="locationId" value={locationId} />
          <input type="hidden" name="destinationLocationId" value={destinationId} />
          <input type="hidden" name="variantId" value={variantId} />

          {variants.length > 0 && (
            <div className="space-y-1.5">
              <Label>Variante</Label>
              <Select value={variantId || "base"} onValueChange={(v) => setVariantId(v === "base" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="base">Produit de base</SelectItem>
                  {variants.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Type de mouvement</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{type === "TRANSFER" ? "Emplacement source" : "Emplacement"}</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {type === "TRANSFER" && (
            <div className="space-y-1.5">
              <Label>Emplacement destination</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {locations.filter((l) => l.id !== locationId).map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quantity">{type === "ADJUSTMENT" ? "Nouvelle quantité exacte" : "Quantité"}</Label>
            <Input id="quantity" name="quantity" type="number" min={1} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Textarea id="reason" name="reason" rows={2} placeholder="Inventaire mensuel, casse, retour…" />
          </div>

          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={pending}>Valider</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
