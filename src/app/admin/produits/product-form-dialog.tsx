"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { saveProductAction, type ProductFormState } from "./actions";
import { uploadProductImageAction } from "./upload-action";

type Option = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  name?: string;
  categoryId?: string;
  brandId?: string | null;
  supplierId?: string | null;
  description?: string | null;
  costPrice?: number;
  sellingPrice?: number;
  promoPrice?: number | null;
  lowStockThreshold?: number;
  featured?: boolean;
  imageUrls?: string[];
  stock?: number;
};

const initialState: ProductFormState = {};

export function ProductFormDialog({
  categories,
  brands,
  suppliers,
  canEditPrice,
  values,
  trigger,
}: {
  categories: Option[];
  brands: Option[];
  suppliers: Option[];
  canEditPrice: boolean;
  values?: ProductFormValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);
  const isEdit = Boolean(values?.id);
  const [categoryId, setCategoryId] = React.useState(values?.categoryId ?? "");
  const [brandId, setBrandId] = React.useState(values?.brandId ?? "");
  const [supplierId, setSupplierId] = React.useState(values?.supplierId ?? "");
  const [images, setImages] = React.useState<string[]>(values?.imageUrls ?? []);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 8 - images.length;
    if (remaining <= 0) {
      toast.error("Maximum 8 photos par produit.");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadProductImageAction(fd);
        if (result.error) {
          toast.error(result.error);
          continue;
        }
        if (result.url) {
          setImages((prev) => [...prev, result.url!]);
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  React.useEffect(() => {
    // Ferme le dialogue une fois la mutation confirmée par le serveur.

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="size-4" /> Nouveau produit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          {values?.id && <input type="hidden" name="id" value={values.id} />}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nom du produit</Label>
            <Input id="name" name="name" required defaultValue={values?.name} />
          </div>

          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="categoryId" value={categoryId} />
          </div>

          <div className="space-y-1.5">
            <Label>Marque</Label>
            <Select value={brandId || "none"} onValueChange={(v) => setBrandId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="brandId" value={brandId} />
          </div>

          <div className="space-y-1.5">
            <Label>Fournisseur</Label>
            <Select value={supplierId || "none"} onValueChange={(v) => setSupplierId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="supplierId" value={supplierId} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" type="number" min={0} defaultValue={values?.stock ?? 0} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lowStockThreshold">Seuil d&apos;alerte</Label>
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" defaultValue={values?.lowStockThreshold ?? 5} />
          </div>

          {canEditPrice ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="costPrice">Prix d&apos;achat (GNF)</Label>
                <Input id="costPrice" name="costPrice" type="number" required defaultValue={values?.costPrice} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellingPrice">Prix de vente (GNF)</Label>
                <Input id="sellingPrice" name="sellingPrice" type="number" required defaultValue={values?.sellingPrice} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promoPrice">Prix promotionnel (optionnel)</Label>
                <Input id="promoPrice" name="promoPrice" type="number" defaultValue={values?.promoPrice ?? ""} />
              </div>
            </>
          ) : (
            <p className="sm:col-span-2 rounded-xl bg-surface-muted px-3 py-2 text-sm text-muted-foreground">
              Vous n&apos;avez pas le droit de modifier les prix.
            </p>
          )}

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox id="featured" name="featured" defaultChecked={values?.featured} />
            <Label htmlFor="featured">Mettre en avant (page d&apos;accueil)</Label>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={values?.description ?? ""} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Photos</Label>
            <input type="hidden" name="imageUrls" value={images.join("\n")} />
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={url} className="group relative size-20 overflow-hidden rounded-xl border border-border bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Retirer la photo"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={cn(
                    "flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong text-muted-foreground transition-colors hover:border-brand hover:text-brand",
                    uploading && "pointer-events-none opacity-60",
                  )}
                >
                  {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                  <span className="text-[10px] font-medium">{uploading ? "Envoi…" : "Ajouter"}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              Prenez une photo ou choisissez-la depuis votre téléphone ou ordinateur. 8 photos maximum, 5 Mo par photo.
            </p>
          </div>

          {state.error && (
            <p className="sm:col-span-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={pending} className="gap-2">
              {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {isEdit ? "Enregistrer" : "Créer le produit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
