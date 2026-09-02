"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateLoyaltyRuleAction, type LoyaltyFormState } from "./actions";

const initialState: LoyaltyFormState = {};

export function LoyaltyRuleForm({ gnfPerPoint }: { gnfPerPoint: number }) {
  const [state, formAction, pending] = useActionState(updateLoyaltyRuleAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="gnfPerPoint">Montant dépensé pour gagner 1 point (GNF)</Label>
        <Input id="gnfPerPoint" name="gnfPerPoint" type="number" defaultValue={gnfPerPoint} className="w-48" />
      </div>
      <Button type="submit" loading={pending}>Enregistrer</Button>
      {state.success && <p className="text-sm text-success">Règle mise à jour.</p>}
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
