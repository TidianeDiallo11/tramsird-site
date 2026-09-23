import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/session";
import { getStoreBranding } from "@/lib/store-branding";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  const [session, branding] = await Promise.all([getCustomerSession(), getStoreBranding()]);
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
        <p className="relative mt-4 text-lg font-bold">Créer un compte</p>
        <p className="relative mt-1 text-sm text-brand-foreground/80">
          Rejoignez {branding.name} pour commander, suivre vos livraisons et cumuler des points fidélité.
        </p>
      </section>

      <div className="-mt-8 relative">
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
