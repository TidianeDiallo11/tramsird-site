import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StaffResetPasswordForm } from "./form";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default async function StaffResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Créer un nouveau mot de passe</h1>
        </div>
        {token ? (
          <StaffResetPasswordForm token={token} />
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="Lien invalide"
            description="Ce lien de réinitialisation est incomplet. Demandez-en un nouveau."
          />
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/staff-login" className="font-medium text-brand hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
