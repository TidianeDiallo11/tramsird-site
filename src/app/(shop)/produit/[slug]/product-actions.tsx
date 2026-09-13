"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/shop/favorite-button";
import { formatGNF, cn } from "@/lib/utils";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  priceDelta: number;
  stock: number;
};

export function ProductActions({
  productId,
  slug,
  name,
  imageUrl,
  basePrice,
  baseStock,
  variants,
  favorited,
}: {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  baseStock: number;
  variants: Variant[];
  favorited?: boolean;
}) {
  const { addItem } = useCart();
  const [variantId, setVariantId] = React.useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = React.useState(1);

  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;
  const price = basePrice + (selectedVariant?.priceDelta ?? 0);
  const stock = variants.length ? (selectedVariant?.stock ?? 0) : baseStock;
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];

  function variantLabel(v: Variant | null) {
    if (!v) return null;
    return [v.size, v.color].filter(Boolean).join(" / ") || null;
  }

  return (
    <div className="space-y-5">
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Taille</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const match = variants.find((v) => v.size === size && (colors.length === 0 || v.color === selectedVariant?.color));
              const active = selectedVariant?.size === size;
              return (
                <button
                  key={size}
                  onClick={() => match && setVariantId(match.id)}
                  className={cn(
                    "min-w-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    active ? "border-brand bg-brand-soft text-brand-strong" : "border-border hover:border-border-strong",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Couleur</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const match = variants.find((v) => v.color === color && (sizes.length === 0 || v.size === selectedVariant?.size));
              const active = selectedVariant?.color === color;
              return (
                <button
                  key={color}
                  onClick={() => match && setVariantId(match.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                    active ? "border-brand bg-brand-soft text-brand-strong" : "border-border hover:border-border-strong",
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-border">
          <button
            className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button
            className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            disabled={qty >= stock}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          {stock > 0 ? `${stock} en stock` : "Rupture de stock"}
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          className="min-w-0 flex-1 gap-2 whitespace-normal"
          disabled={stock <= 0 || (variants.length > 0 && !variantId)}
          onClick={() =>
            addItem({
              productId,
              variantId,
              slug,
              name,
              variantLabel: variantLabel(selectedVariant),
              imageUrl,
              unitPrice: price,
              maxQuantity: stock,
              quantity: qty,
            })
          }
        >
          <ShoppingBag className="size-5" />
          {stock > 0 ? `Ajouter au panier — ${formatGNF(price * qty)}` : "Indisponible"}
        </Button>
        <FavoriteButton
          productId={productId}
          initialFavorited={favorited}
          alwaysVisible
          className="size-13 shrink-0 rounded-full border border-border-strong bg-surface"
        />
      </div>
    </div>
  );
}
