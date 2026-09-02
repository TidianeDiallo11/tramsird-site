import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  const session = await getCustomerSession();
  if (session) redirect("/compte");

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rejoignez ShopFlow pour commander, suivre vos livraisons et cumuler des points fidélité.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà client ?{" "}
        <Link href="/connexion" className="font-medium text-brand hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
