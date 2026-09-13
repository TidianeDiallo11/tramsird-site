import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shop/product-card";
import { getProductBySlug, getRelatedProducts, withFavorites } from "@/lib/data/catalog";
import { getFavoriteProductIds } from "@/lib/data/favorites";
import { formatGNF } from "@/lib/utils";
import { ProductActions } from "./product-actions";
import { ProductGallery } from "./product-gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Produit" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [relatedRaw, favoriteIds] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id, 4),
    getFavoriteProductIds(),
  ]);
  const related = await withFavorites(relatedRaw);
  const hasPromo = product.promoPrice != null && product.promoPrice < product.sellingPrice;

  const variants = product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    priceDelta: v.priceDelta,
    stock: product.variantStocks.get(v.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand?.name ?? product.category.name}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-brand-strong">
              {formatGNF(hasPromo ? product.promoPrice! : product.sellingPrice)}
            </span>
            {hasPromo && (
              <span className="text-base text-muted-foreground line-through">
                {formatGNF(product.sellingPrice)}
              </span>
            )}
            {hasPromo && (
              <Badge variant="accent">
                -{Math.round((1 - product.promoPrice! / product.sellingPrice) * 100)}%
              </Badge>
            )}
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <ProductActions
            productId={product.id}
            slug={product.slug}
            name={product.name}
            imageUrl={product.images[0]?.url ?? null}
            basePrice={hasPromo ? product.promoPrice! : product.sellingPrice}
            baseStock={product.stock}
            variants={variants}
            favorited={favoriteIds.has(product.id)}
          />

          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border p-4 text-sm sm:grid-cols-3">
            <InfoRow icon={Truck} label="Livraison ou retrait en boutique" />
            <InfoRow icon={ShieldCheck} label="Paiement sécurisé" />
            <InfoRow icon={RotateCcw} label="Retour sous 48h" />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <dt>Référence</dt>
            <dd className="text-foreground">{product.sku}</dd>
            {product.brand && (
              <>
                <dt>Marque</dt>
                <dd className="text-foreground">{product.brand.name}</dd>
              </>
            )}
            <dt>Catégorie</dt>
            <dd className="text-foreground">{product.category.name}</dd>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold">Vous pourriez aussi aimer</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label }: { icon: typeof Truck; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 shrink-0 text-brand" />
      <span>{label}</span>
    </div>
  );
}
