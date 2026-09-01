"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerCustomerAction, type AuthState } from "../actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    registerCustomerAction,
    {},
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" name="name" required placeholder="Mariam Diallo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" required placeholder="622 00 00 00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input id="email" name="email" type="email" placeholder="vous@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" className="w-full" loading={pending}>
            Créer mon compte
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
