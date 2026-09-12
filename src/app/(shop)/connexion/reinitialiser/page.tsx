import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ envoye?: string }>;
}) {
  const { envoye } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Créer un nouveau mot de passe</h1>
      {envoye && (
        <p className="mt-1 text-sm text-muted-foreground">
          Si un compte existe avec ce numéro, un code vous a été envoyé par SMS.
        </p>
      )}
      <div className="mt-6">
        <ResetPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/connexion/mot-de-passe-oublie" className="font-medium text-brand hover:underline">
          Je n&apos;ai pas reçu de code
        </Link>
      </p>
    </div>
  );
}
