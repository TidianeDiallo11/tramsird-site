import Link from "next/link";
import { Logo } from "@/components/shop/logo";

export function SiteFooter({
  storeName = "ShopFlow",
  logoUrl,
}: {
  storeName?: string;
  logoUrl?: string | null;
}) {
  return (
    <footer className="hidden border-t border-border bg-surface-muted md:block">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo name={storeName} logoUrl={logoUrl} />
            <p className="max-w-xs text-sm text-muted-foreground">
              La plateforme tout-en-un pour vendre en ligne et en boutique, gérer
              votre stock et vos clients en Guinée.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Boutique</p>
            <Link href="/catalogue" className="block text-muted-foreground hover:text-foreground">Catalogue</Link>
            <Link href="/catalogue?promo=1" className="block text-muted-foreground hover:text-foreground">Promotions</Link>
            <Link href="/compte/commandes" className="block text-muted-foreground hover:text-foreground">Suivre ma commande</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Compte</p>
            <Link href="/compte" className="block text-muted-foreground hover:text-foreground">Mon compte</Link>
            <Link href="/compte/favoris" className="block text-muted-foreground hover:text-foreground">Favoris</Link>
            <Link href="/staff-login" className="block text-muted-foreground hover:text-foreground">Espace équipe</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Paiement</p>
            <p className="text-muted-foreground">Orange Money · Espèces</p>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {storeName} — Conakry, Guinée.
        </p>
      </div>
    </footer>
  );
}
