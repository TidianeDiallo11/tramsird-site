import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getStaffSession } from "@/lib/session";
import { getStoreBranding } from "@/lib/store-branding";
import { StaffLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion équipe" };

export default async function StaffLoginPage() {
  const [session, branding] = await Promise.all([getStaffSession(), getStoreBranding()]);
  if (session) redirect(session.role === "CASHIER" ? "/pos" : "/admin");

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground card-shadow">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Espace équipe {branding.name}</h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour accéder à la caisse ou au tableau de bord.
            </p>
          </div>
        </div>

        <StaffLoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Client ?{" "}
          <Link href="/" className="font-medium text-brand hover:underline">
            Retour à la boutique
          </Link>
        </p>
      </div>
    </main>
  );
}
