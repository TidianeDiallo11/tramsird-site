"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { savePromotionAction, type PromoFormState } from "./actions";

const initialState: PromoFormState = {};

export function PromotionFormDialog({
  products,
  categories,
}: {
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(savePromotionAction, initialState);
  const [type, setType] = React.useState("PERCENT");
  const [scope, setScope] = React.useState<"product" | "category">("category");
  const [targetId, setTargetId] = React.useState("");

  React.useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="size-4" /> Nouvelle promotion</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouvelle promotion</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required placeholder="Semaine électronique -10%" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Pourcentage (%)</SelectItem>
                  <SelectItem value="FIXED">Montant fixe (GNF)</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="type" value={type} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Valeur</Label>
              <Input id="value" name="value" type="number" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>S&apos;applique à</Label>
            <div className="flex gap-2">
              <Select value={scope} onValueChange={(v) => { setScope(v as "product" | "category"); setTargetId(""); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Catégorie</SelectItem>
                  <SelectItem value="product">Produit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {(scope === "category" ? categories : products).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input type="hidden" name={scope === "category" ? "categoryId" : "productId"} value={targetId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Date de début</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={nextMonth} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usageLimit">Limite d&apos;utilisation</Label>
              <Input id="usageLimit" name="usageLimit" type="number" placeholder="Illimité" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="couponCode">Code promo (optionnel)</Label>
              <Input id="couponCode" name="couponCode" placeholder="ETE2026" />
            </div>
          </div>

          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={pending}>Créer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
