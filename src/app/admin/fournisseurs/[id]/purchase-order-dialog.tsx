"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatGNF } from "@/lib/utils";
import { createPurchaseOrderAction } from "../actions";

type Product = { id: string; name: string; costPrice: number };
type Row = { productId: string; quantity: number; unitCost: number };

export function PurchaseOrderDialog({ supplierId, products }: { supplierId: string; products: Product[] }) {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [pending, setPending] = React.useState(false);

  function addRow() {
    if (products.length === 0) return;
    setRows((r) => [...r, { productId: products[0].id, quantity: 1, unitCost: products[0].costPrice }]);
  }
  function updateRow(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  const total = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);

  async function submit() {
    setPending(true);
    try {
      const res = await createPurchaseOrderAction(supplierId, rows);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Commande de réapprovisionnement créée");
        setRows([]);
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Plus className="size-4" /> Commande de réappro.</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouvelle commande de réapprovisionnement</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={row.productId} onValueChange={(v) => updateRow(i, { productId: v, unitCost: products.find((p) => p.id === v)?.costPrice ?? row.unitCost })}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" className="w-20" value={row.quantity} onChange={(e) => updateRow(i, { quantity: Number(e.target.value) || 1 })} min={1} />
              <Input type="number" className="w-28" value={row.unitCost} onChange={(e) => updateRow(i, { unitCost: Number(e.target.value) || 0 })} />
              <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-danger"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5"><Plus className="size-3.5" /> Ajouter un produit</Button>
          {rows.length > 0 && (
            <p className="text-right text-sm font-semibold">Total : {formatGNF(total)}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} loading={pending} disabled={rows.length === 0}>Créer la commande</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
