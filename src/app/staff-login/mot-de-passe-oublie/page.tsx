import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { StaffForgotPasswordForm } from "./form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function StaffForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string }>;
}) {
  const { envoye } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recevez un lien de réinitialisation par email.
          </p>
        </div>
        {envoye && (
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" /> Si un compte existe avec cet email, un lien vous a été envoyé.
          </p>
        )}
        <StaffForgotPasswordForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/staff-login" className="font-medium text-brand hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
