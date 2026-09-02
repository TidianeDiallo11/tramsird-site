import type { Metadata } from "next";
import Link from "next/link";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { searchProducts, withFavorites } from "@/lib/data/catalog";
import { CatalogFilters } from "./filters";

export const metadata: Metadata = { title: "Catalogue" };

const SORT_MAP = {
  populaire: "relevance",
  recent: "newest",
  prix_asc: "price_asc",
  prix_desc: "price_desc",
} as const;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  const { items, total, pageCount, brands } = await searchProducts({
    q: sp.q,
    categorySlug: sp.categorie,
    brand: sp.marque,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    promoOnly: sp.promo === "1",
    inStockOnly: sp.dispo === "1",
    sort: SORT_MAP[(sp.tri as keyof typeof SORT_MAP) ?? "populaire"],
    page,
  });
  const withFav = await withFavorites(items);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">
          {sp.q ? `Résultats pour « ${sp.q} »` : "Catalogue"}
        </h1>
        <p className="text-sm text-muted-foreground">{total} produit{total > 1 ? "s" : ""}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <CatalogFilters brands={brands} />

        <div>
          {items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Aucun produit trouvé"
              description="Essayez d'autres mots-clés ou réinitialisez les filtres."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {withFav.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <PageLink sp={sp} page={page - 1} disabled={page <= 1}>
                <ChevronLeft className="size-4" />
              </PageLink>
              <span className="px-3 text-sm text-muted-foreground">
                Page {page} / {pageCount}
              </span>
              <PageLink sp={sp} page={page + 1} disabled={page >= pageCount}>
                <ChevronRight className="size-4" />
              </PageLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageLink({
  sp,
  page,
  disabled,
  children,
}: {
  sp: Record<string, string | undefined>;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams(sp as Record<string, string>);
  params.set("page", String(page));
  if (disabled) {
    return (
      <Button variant="outline" size="icon" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Link href={`/catalogue?${params.toString()}`}>
      <Button variant="outline" size="icon">{children}</Button>
    </Link>
  );
}
