"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestCustomerResetAction, type RequestResetState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<RequestResetState, FormData>(
    requestCustomerResetAction,
    {},
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Téléphone ou email</Label>
            <Input id="identifier" name="identifier" required placeholder="622 00 00 00 ou vous@email.com" />
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" className="w-full" loading={pending}>
            Recevoir un code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
