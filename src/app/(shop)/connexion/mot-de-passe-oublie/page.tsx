import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Renseignez votre numéro de téléphone, nous vous envoyons un code par SMS pour créer un nouveau mot de passe.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/connexion" className="font-medium text-brand hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
