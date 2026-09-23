"use client";

import * as React from "react";
import { useActionState } from "react";
import { User, Phone, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerCustomerAction, type AuthState } from "../compte/actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    registerCustomerAction,
    {},
  );
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Card className="rounded-3xl card-shadow-lg">
      <CardContent className="space-y-4 p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                required
                placeholder="Mariam Diallo"
                className="h-12 rounded-full pl-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                required
                placeholder="622 00 00 00"
                className="h-12 rounded-full pl-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optionnel)</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vous@email.com"
                className="h-12 rounded-full pl-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="h-12 rounded-full pr-11 pl-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {state.error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" size="lg" className="w-full rounded-full" loading={pending}>
            Créer mon compte
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
