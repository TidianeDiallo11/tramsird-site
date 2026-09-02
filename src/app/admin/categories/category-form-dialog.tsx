"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveCategoryAction, type CategoryFormState } from "./actions";

const initialState: CategoryFormState = {};

export function CategoryFormDialog({
  categories,
  values,
  trigger,
}: {
  categories: { id: string; name: string }[];
  values?: { id?: string; name?: string; parentId?: string | null; imageUrl?: string | null };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(saveCategoryAction, initialState);
  const [parentId, setParentId] = React.useState(values?.parentId ?? "");
  const isEdit = Boolean(values?.id);

  React.useEffect(() => {
    // Ferme le dialogue une fois la mutation confirmée par le serveur.

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="gap-2"><Plus className="size-4" /> Nouvelle catégorie</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {values?.id && <input type="hidden" name="id" value={values.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required defaultValue={values?.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Catégorie parente</Label>
            <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Aucune (catégorie principale)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune (catégorie principale)</SelectItem>
                {categories.filter((c) => c.id !== values?.id).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="parentId" value={parentId} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">Image (URL)</Label>
            <Input id="imageUrl" name="imageUrl" defaultValue={values?.imageUrl ?? ""} placeholder="https://…" />
          </div>
          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" loading={pending} className="gap-2">
              {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
