"use client";

import { useEffect } from "react";

// Safari iOS n'applique le pseudo-état :active sur les liens/boutons que si un
// écouteur touch existe quelque part sur la page — sans ça, aucun retour visuel
// au toucher, même avec du CSS :active bien défini. Écouteur vide, monté une
// seule fois à la racine.
export function TouchActiveEnabler() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
