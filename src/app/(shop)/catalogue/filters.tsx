"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function CatalogFilters({ brands }: { brands: { name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  }

  const content = (
    <div className="space-y-6">
      <div>
        <Label>Trier par</Label>
        <Select value={params.get("tri") ?? "populaire"} onValueChange={(v) => update({ tri: v })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="populaire">Pertinence</SelectItem>
            <SelectItem value="recent">Nouveautés</SelectItem>
            <SelectItem value="prix_asc">Prix croissant</SelectItem>
            <SelectItem value="prix_desc">Prix décroissant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Prix (GNF)</Label>
        <form
          className="mt-1.5 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update({ min: String(fd.get("min") ?? ""), max: String(fd.get("max") ?? "") });
          }}
        >
          <Input name="min" type="number" placeholder="Min" defaultValue={params.get("min") ?? ""} />
          <span className="text-muted-foreground">–</span>
          <Input name="max" type="number" placeholder="Max" defaultValue={params.get("max") ?? ""} />
          <Button type="submit" size="sm" variant="outline">OK</Button>
        </form>
      </div>

      {brands.length > 0 && (
        <div>
          <Label>Marque</Label>
          <Select value={params.get("marque") ?? "all"} onValueChange={(v) => update({ marque: v === "all" ? null : v })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <label className="flex items-center gap-2.5">
        <Checkbox
          checked={params.get("promo") === "1"}
          onCheckedChange={(v) => update({ promo: v ? "1" : null })}
        />
        <span className="text-sm">Uniquement les promotions</span>
      </label>

      <label className="flex items-center gap-2.5">
        <Checkbox
          checked={params.get("dispo") === "1"}
          onCheckedChange={(v) => update({ dispo: v ? "1" : null })}
        />
        <span className="text-sm">Uniquement en stock</span>
      </label>

      {params.toString() && (
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push(pathname)}>
          <X className="size-3.5" /> Réinitialiser les filtres
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4" /> Filtres
        </h2>
        {content}
      </div>
      <div className="lg:hidden">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="size-4" /> Filtres
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Filtres</DialogTitle>
            {content}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
