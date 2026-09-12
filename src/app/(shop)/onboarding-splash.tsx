"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Tag, Boxes, Truck, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "nl-trading-splash-seen";

export function OnboardingSplash() {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    // Ne montre l'écran d'accueil qu'à la toute première visite sur cet appareil.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      if (localStorage.getItem(STORAGE_KEY)) setVisible(false);
    } catch {
      // Stockage indisponible (navigation privée) : on affiche l'écran par défaut.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignoré : l'écran réapparaîtra simplement à la prochaine visite.
    }
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-to-b from-brand-strong to-brand px-6 py-10 text-center text-white safe-bottom">
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branding/nl-trading-mark-light.svg" alt="NL Trading" className="h-40 w-auto" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Qualité · Confiance · Partenariat
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold leading-tight text-balance">
            Vos produits, plus proches de vous&nbsp;!
          </h1>
          <p className="text-sm text-white/80">Commandez en ligne, nous livrons pour vous.</p>
        </div>
        <div className="grid w-full max-w-xs grid-cols-2 gap-x-4 gap-y-5 text-left">
          <Feature icon={Tag} label="Prix compétitifs" />
          <Feature icon={Boxes} label="Vente en gros et détail" />
          <Feature icon={Truck} label="Livraison rapide" />
          <Feature icon={ShieldCheck} label="Produits de qualité" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-xs shrink-0 space-y-4 pt-6">
        <button
          type="button"
          onClick={dismiss}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-bold text-brand-strong transition-transform active:scale-[0.98]"
        >
          Commencer <ArrowRight className="size-4" />
        </button>
        <p className="text-xs text-white/70">
          Déjà un compte ?{" "}
          <Link href="/connexion" onClick={dismiss} className="font-semibold text-white underline underline-offset-2">
            Se connecter
          </Link>
          {" · "}
          <Link href="/inscription" onClick={dismiss} className="font-semibold text-white underline underline-offset-2">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Tag; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-accent">
        <Icon className="size-4.5" />
      </span>
      <span className="text-xs font-medium text-white/90">{label}</span>
    </div>
  );
}
