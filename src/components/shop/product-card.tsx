import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/shop/favorite-button";
import { formatGNF } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  promoPrice: number | null;
  stock: number;
  category: { name: string; slug: string };
  brand: { name: string } | null;
  images: { url: string }[];
  favorited?: boolean;
};

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const hasPromo = product.promoPrice != null && product.promoPrice < product.sellingPrice;
  const discountPct = hasPromo
    ? Math.round((1 - product.promoPrice! / product.sellingPrice) * 100)
    : 0;

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:card-shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        {product.images[0] ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Photo</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasPromo && <Badge variant="accent">-{discountPct}%</Badge>}
          {product.stock <= 0 && <Badge variant="danger">Rupture</Badge>}
        </div>
        <FavoriteButton
          productId={product.id}
          initialFavorited={product.favorited}
          className="absolute right-2 top-2"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.brand?.name ?? product.category.name}
        </p>
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-bold text-brand-strong">
            {formatGNF(hasPromo ? product.promoPrice! : product.sellingPrice)}
          </span>
          {hasPromo && (
            <span className="text-xs text-muted-foreground line-through">
              {formatGNF(product.sellingPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
