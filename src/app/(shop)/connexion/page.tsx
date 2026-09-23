import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCustomerSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reinitialise?: string }>;
}) {
  const [session, { reinitialise }] = await Promise.all([getCustomerSession(), searchParams]);
  if (session) redirect("/compte");

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Content de vous revoir</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connectez-vous pour suivre vos commandes et vos favoris.
      </p>
      {reinitialise && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> Mot de passe réinitialisé, vous pouvez vous connecter.
        </p>
      )}
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-brand hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
