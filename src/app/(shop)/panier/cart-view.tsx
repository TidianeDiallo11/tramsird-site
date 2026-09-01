"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatGNF } from "@/lib/utils";

export function CartView() {
  const { items, subtotal, updateQuantity, removeItem, couponCode, setCoupon } = useCart();
  const router = useRouter();
  const [couponInput, setCouponInput] = React.useState(couponCode ?? "");
  const [discount, setDiscount] = React.useState(0);
  const [checking, setChecking] = React.useState(false);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setCoupon(data.code);
        toast.success("Code promo appliqué", { description: `-${formatGNF(data.discount)}` });
      } else {
        setDiscount(0);
        setCoupon(null);
        toast.error(data.message ?? "Code promo invalide");
      }
    } finally {
      setChecking(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Votre panier est vide"
        description="Parcourez le catalogue pour trouver votre bonheur."
        action={
          <Link href="/catalogue">
            <Button>Voir le catalogue</Button>
          </Link>
        }
      />
    );
  }

  const total = Math.max(0, subtotal - discount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={`${item.productId}-${item.variantId}`} className="flex gap-3 p-3">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/produit/${item.slug}`} className="text-sm font-semibold hover:underline">
                    {item.name}
                  </Link>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-muted-foreground hover:text-danger cursor-pointer"
                  aria-label="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    className="flex size-8 items-center justify-center text-muted-foreground"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    className="flex size-8 items-center justify-center text-muted-foreground disabled:opacity-40"
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxQuantity}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="font-semibold">{formatGNF(item.unitPrice * item.quantity)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="h-fit space-y-4 p-5">
        <h2 className="font-semibold">Résumé</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Code promo</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="BIENVENUE10"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={applyCoupon} loading={checking}>
              Valider
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatGNF(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remise</span>
            <span className={discount > 0 ? "text-success" : ""}>-{formatGNF(discount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Livraison</span>
            <span>Calculée à l&apos;étape suivante</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatGNF(total)}</span>
        </div>

        <Button size="lg" className="w-full" onClick={() => router.push("/checkout")}>
          Passer la commande
        </Button>
      </Card>
    </div>
  );
}
