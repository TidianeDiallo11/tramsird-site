import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  const session = await getCustomerSession();
  if (session) redirect("/compte");

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Content de vous revoir</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connectez-vous pour suivre vos commandes et vos favoris.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/compte/inscription" className="font-medium text-brand hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
