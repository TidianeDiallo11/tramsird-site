import type { Metadata } from "next";
import { Search, Package } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { searchProducts, withFavorites } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Rechercher" };

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const results = q ? withFavorites((await searchProducts({ q, sort: "relevance" })).items) : null;
  const items = results ? await results : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {!q ? (
        <EmptyState
          icon={Search}
          title="Que recherchez-vous ?"
          description="Tapez le nom d'un produit ou d'une marque ci-dessus."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit trouvé"
          description={`Aucun résultat pour « ${q} ».`}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
