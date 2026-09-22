import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { OnboardingSplash } from "./onboarding-splash";
import { SPLASH_DISMISSED_COOKIE } from "./splash-constants";
import { getCustomerSession } from "@/lib/session";
import {
  getBestSellers,
  getCategoriesTree,
  getFeaturedProducts,
  getNewProducts,
  withFavorites,
} from "@/lib/data/catalog";
import { Package } from "lucide-react";

export default async function HomePage() {
  const cookieStore = await cookies();
  const [customer, categories, featuredRaw, newArrivalsRaw, bestSellersRaw] = await Promise.all([
    getCustomerSession(),
    getCategoriesTree(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getBestSellers(8),
  ]);
  const [featured, newArrivals, bestSellers] = await Promise.all([
    withFavorites(featuredRaw),
    withFavorites(newArrivalsRaw),
    withFavorites(bestSellersRaw),
  ]);
  const splashDismissedThisVisit = cookieStore.get(SPLASH_DISMISSED_COOKIE)?.value === "1";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      {/* Tant qu'on n'a pas de compte : affiché à chaque vraie réouverture de
          l'appli, mais pas à chaque fois qu'on retape sur "Accueil" pendant
          la même visite (cookie de session, voir splash-constants.ts). */}
      {!customer && !splashDismissedThisVisit && <OnboardingSplash />}
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-strong via-brand to-brand-strong px-6 py-12 text-brand-foreground sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-xl space-y-5">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            Livraison rapide à Conakry
          </span>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Tout ce dont vous avez besoin, livré chez vous.
          </h1>
          <p className="text-brand-foreground/85">
            Téléphones, mode, maison et plus encore — payez en Orange Money ou
            en espèces à la livraison.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/catalogue">
              <Button size="lg" variant="accent" className="gap-2">
                Découvrir la boutique <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/nl-trading-mark-light.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-10 top-1/2 hidden h-[140%] w-auto -translate-y-1/2 opacity-[0.08] lg:block"
        />
        <div className="motion-safe:animate-[float-slow_10s_ease-in-out_infinite] pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="motion-safe:animate-[float-slow_12s_ease-in-out_infinite] pointer-events-none absolute -bottom-24 right-10 size-64 rounded-full bg-accent/30 blur-3xl [animation-delay:-3s]" />
      </section>

      {/* Categories */}
      <SectionHeader title="Catégories" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogue?categorie=${cat.slug}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center transition-all hover:border-brand active:scale-95 active:bg-surface-muted"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
              <Package className="size-5" />
            </div>
            <span className="text-xs font-medium leading-tight">{cat.name}</span>
          </Link>
        ))}
      </div>

      <ProductSection title="Produits populaires" href="/catalogue?tri=populaire" products={featured} priorityCount={4} />
      <ProductSection title="Nouveautés" href="/catalogue?tri=recent" products={newArrivals} />
      <ProductSection title="Meilleures ventes" href="/catalogue?tri=populaire" products={bestSellers} />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 mt-10 text-lg font-bold">{title}</h2>;
}

function ProductSection({
  title,
  href,
  products,
  priorityCount = 0,
}: {
  title: string;
  href: string;
  products: Awaited<ReturnType<typeof getFeaturedProducts>>;
  priorityCount?: number;
}) {
  return (
    <section>
      <div className="mt-10 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand hover:underline">
          Voir tout
        </Link>
      </div>
      {products.length === 0 ? (
        <EmptyState icon={Package} title="Aucun produit pour le moment" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < priorityCount} />
          ))}
        </div>
      )}
    </section>
  );
}
