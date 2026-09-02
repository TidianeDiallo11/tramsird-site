"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateStoreSettingsAction, type SettingsFormState } from "./actions";

const initialState: SettingsFormState = {};

export function SettingsForm({
  settings,
}: {
  settings: { name: string; phone: string | null; email: string | null; address: string | null; logoUrl: string | null; taxRatePct: number };
}) {
  const [state, formAction, pending] = useActionState(updateStoreSettingsAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="name">Nom du commerce</Label>
        <Input id="name" name="name" required defaultValue={settings.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" defaultValue={settings.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={settings.email ?? ""} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="address">Adresse</Label>
        <Textarea id="address" name="address" rows={2} defaultValue={settings.address ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="logoUrl">Logo (URL)</Label>
        <Input id="logoUrl" name="logoUrl" defaultValue={settings.logoUrl ?? ""} placeholder="https://…" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="taxRatePct">Taxe (%)</Label>
        <Input id="taxRatePct" name="taxRatePct" type="number" defaultValue={settings.taxRatePct} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Devise</Label>
        <Input value="GNF (Franc Guinéen)" disabled />
      </div>

      {state.error && <p className="sm:col-span-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.success && <p className="sm:col-span-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">Paramètres enregistrés.</p>}

      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>Enregistrer</Button>
      </div>
    </form>
  );
}
