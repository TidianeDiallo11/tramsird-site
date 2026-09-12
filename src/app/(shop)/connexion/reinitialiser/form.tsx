"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetCustomerPasswordAction, type ResetPasswordState } from "./actions";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetCustomerPasswordAction,
    {},
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Code reçu par SMS</Label>
            <Input
              id="code"
              name="code"
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" className="w-full" loading={pending}>
            Réinitialiser mon mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
