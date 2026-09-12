"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginCustomerAction, type AuthState } from "../compte/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginCustomerAction,
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link href="/connexion/mot-de-passe-oublie" className="text-xs font-medium text-brand hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required />
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" className="w-full" loading={pending}>
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
