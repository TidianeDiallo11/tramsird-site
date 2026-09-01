"use client";

import * as React from "react";
import { useActionState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { saveZoneAction, type ZoneFormState } from "./actions";

const initialState: ZoneFormState = {};

export function ZoneFormDialog({
  values,
  trigger,
}: {
  values?: { id?: string; name?: string; fee?: number; estimatedDays?: number };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(saveZoneAction, initialState);
  const isEdit = Boolean(values?.id);

  React.useEffect(() => {
    // Ferme le dialogue une fois la mutation confirmée par le serveur.

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="gap-2"><Plus className="size-4" /> Nouvelle zone</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Modifier la zone" : "Nouvelle zone de livraison"}</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          {values?.id && <input type="hidden" name="id" value={values.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom de la zone</Label>
            <Input id="name" name="name" required defaultValue={values?.name} placeholder="Ratoma, Kaloum…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fee">Frais (GNF)</Label>
              <Input id="fee" name="fee" type="number" required defaultValue={values?.fee} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedDays">Délai (jours)</Label>
              <Input id="estimatedDays" name="estimatedDays" type="number" required defaultValue={values?.estimatedDays ?? 1} />
            </div>
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
