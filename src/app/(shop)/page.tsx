import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { OnboardingSplash } from "./onboarding-splash";
import {
  getBestSellers,
  getCategoriesTree,
  getFeaturedProducts,
  getNewProducts,
  getPromotedProducts,
  withFavorites,
} from "@/lib/data/catalog";
import { Package } from "lucide-react";

export default async function HomePage() {
  const [categories, featuredRaw, newArrivalsRaw, promotedRaw, bestSellersRaw] = await Promise.all([
    getCategoriesTree(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getPromotedProducts(8),
    getBestSellers(8),
  ]);
  const [featured, newArrivals, promoted, bestSellers] = await Promise.all([
    withFavorites(featuredRaw),
    withFavorites(newArrivalsRaw),
    withFavorites(promotedRaw),
    withFavorites(bestSellersRaw),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <OnboardingSplash />
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
            <Link href="/catalogue?promo=1">
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                Voir les promotions
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

      {/* Trust badges */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TrustCard icon={Wallet} title="Orange Money & Espèces" desc="Payez par Orange Money ou à la livraison." />
        <TrustCard icon={Truck} title="Livraison ou retrait" desc="Livraison locale ou retrait gratuit en boutique." />
        <TrustCard icon={ShieldCheck} title="Achat sécurisé" desc="Vos données et paiements sont protégés." />
      </section>

      {/* Categories */}
      <SectionHeader title="Catégories" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogue?categorie=${cat.slug}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center transition-colors hover:border-brand"
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
      <ProductSection title="Promotions du moment" href="/catalogue?promo=1" products={promoted} accent />
      <ProductSection title="Meilleures ventes" href="/catalogue?tri=populaire" products={bestSellers} />
    </div>
  );
}

function TrustCard({ icon: Icon, title, desc }: { icon: typeof Wallet; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
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
  accent,
  priorityCount = 0,
}: {
  title: string;
  href: string;
  products: Awaited<ReturnType<typeof getFeaturedProducts>>;
  accent?: boolean;
  priorityCount?: number;
}) {
  return (
    <section>
      <div className="mt-10 mb-3 flex items-center justify-between">
        <h2 className={accent ? "text-lg font-bold text-accent-foreground" : "text-lg font-bold"}>{title}</h2>
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
