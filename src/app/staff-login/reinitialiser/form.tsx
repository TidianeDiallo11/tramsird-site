"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetStaffPasswordAction, type ResetPasswordState } from "./actions";

export function StaffResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetStaffPasswordAction,
    {},
  );

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="pl-10"
              />
            </div>
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
