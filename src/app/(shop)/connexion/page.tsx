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
    <div className="mx-auto max-w-sm px-4 pb-10">
      <section className="relative -mx-4 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-strong via-brand to-brand-strong px-6 pt-10 pb-14 text-center text-brand-foreground sm:mx-0 sm:rounded-[2.5rem]">
        <div className="motion-safe:animate-[float-slow_9s_ease-in-out_infinite] pointer-events-none absolute -left-12 top-4 size-40 rounded-full bg-white/10 blur-3xl" />
        <div className="motion-safe:animate-[float-slow_11s_ease-in-out_infinite] pointer-events-none absolute -right-10 bottom-0 size-48 rounded-full bg-accent/25 blur-3xl [animation-delay:-4s]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/nl-trading-mark-light.svg"
          alt="NL Trading"
          className="relative mx-auto h-16 w-auto motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700"
        />
        <p className="relative mt-4 text-lg font-bold">Content de vous revoir</p>
        <p className="relative mt-1 text-sm text-brand-foreground/80">
          Connectez-vous pour suivre vos commandes et vos favoris.
        </p>
      </section>

      {reinitialise && (
        <p className="mt-6 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> Mot de passe réinitialisé, vous pouvez vous connecter.
        </p>
      )}

      <div className="-mt-8 relative">
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
