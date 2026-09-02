"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  ScanLine,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { formatGNF, cn } from "@/lib/utils";
import { holdSaleAction, deleteHeldSaleAction, type PosCartItem } from "./actions";
import { PaymentDialog } from "./payment-dialog";

type Variant = { id: string; label: string; priceDelta: number; barcode: string | null; stock: number };
type ProductData = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  imageUrl: string | null;
  stock: number;
  variants: Variant[];
};
type HeldSale = { id: string; label: string | null; cartData: PosCartItem[]; createdAt: string };

type CartLine = PosCartItem & { maxQuantity: number };

export function PosClient({
  sessionId,
  cashierName,
  canDiscount,
  products,
  heldSales,
}: {
  sessionId: string;
  cashierName: string;
  canDiscount: boolean;
  products: ProductData[];
  heldSales: HeldSale[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [cartOpenMobile, setCartOpenMobile] = React.useState(false);
  const [heldOpen, setHeldOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode?.includes(q),
    );
  }, [query, products]);

  function addToCart(product: ProductData, variant?: Variant) {
    const maxQuantity = variant ? variant.stock : product.stock;
    if (maxQuantity <= 0) {
      toast.error("Produit en rupture de stock");
      return;
    }
    const unitPrice = product.sellingPrice + (variant?.priceDelta ?? 0);
    const name = variant ? `${product.name} — ${variant.label}` : product.name;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.variantId === (variant?.id ?? null));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.min(next[idx].quantity + 1, maxQuantity) };
        return next;
      }
      return [...prev, { productId: product.id, variantId: variant?.id ?? null, name, unitPrice, quantity: 1, maxQuantity }];
    });
  }

  function updateQty(productId: string, variantId: string | null, qty: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, quantity: Math.max(0, Math.min(qty, i.maxQuantity)) } : i))
        .filter((i) => i.quantity > 0),
    );
  }

  function removeItem(productId: string, variantId: string | null) {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }

  function handleBarcode(code: string) {
    const product = products.find((p) => p.barcode === code || p.sku === code);
    if (product) {
      addToCart(product);
      toast.success(`${product.name} ajouté`);
      return;
    }
    for (const p of products) {
      const variant = p.variants.find((v) => v.barcode === code);
      if (variant) {
        addToCart(p, variant);
        toast.success(`${p.name} ajouté`);
        return;
      }
    }
    toast.error("Code-barres inconnu");
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  async function holdCurrentSale() {
    if (cart.length === 0) return;
    await holdSaleAction(sessionId, `Vente de ${cashierName}`, cart);
    setCart([]);
    setDiscount(0);
    toast.success("Vente mise en attente");
    router.refresh();
  }

  function resumeSale(sale: HeldSale) {
    setCart(sale.cartData.map((i) => ({ ...i, maxQuantity: i.quantity })));
    deleteHeldSaleAction(sale.id).then(() => router.refresh());
    setHeldOpen(false);
  }

  function onCheckoutSuccess() {
    setCart([]);
    setDiscount(0);
    setCustomerPhone("");
    setPaymentOpen(false);
    setCartOpenMobile(false);
    router.refresh();
  }

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-semibold">Panier ({cart.length})</h2>
        <button onClick={() => setCartOpenMobile(false)} className="lg:hidden">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Panier vide" description="Recherchez ou scannez un produit" />
        ) : (
          cart.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-2 rounded-xl bg-surface-muted p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatGNF(item.unitPrice)}</p>
              </div>
              <div className="flex items-center rounded-full border border-border bg-surface">
                <button className="flex size-7 items-center justify-center text-muted-foreground" onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}>
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button className="flex size-7 items-center justify-center text-muted-foreground disabled:opacity-30" disabled={item.quantity >= item.maxQuantity} onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}>
                  <Plus className="size-3.5" />
                </button>
              </div>
              <button onClick={() => removeItem(item.productId, item.variantId)} className="text-muted-foreground hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="space-y-3 border-t border-border p-4">
        {canDiscount && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Remise (GNF)</label>
            <Input
              type="number"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="h-9 w-32 ml-auto text-right"
              min={0}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Client (tél.)</label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Optionnel"
            className="h-9 ml-auto w-40 text-right"
          />
        </div>
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span>{formatGNF(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span>-{formatGNF(discount)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatGNF(total)}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="gap-1.5" onClick={holdCurrentSale} disabled={cart.length === 0}>
            <PauseCircle className="size-4" /> Attente
          </Button>
          <Button className="gap-1.5" onClick={() => setPaymentOpen(true)} disabled={cart.length === 0}>
            Encaisser
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid h-svh grid-rows-[auto_1fr] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
      <div className="row-span-1 flex flex-col overflow-hidden lg:col-span-1">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface p-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit, SKU…" className="pl-9" />
          </div>
          <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)} aria-label="Scanner">
            <ScanLine className="size-4" />
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setHeldOpen(true)}>
            <PlayCircle className="size-4" /> En attente
            {heldSales.length > 0 && <Badge variant="warning">{heldSales.length}</Badge>}
          </Button>
          <span className="ml-auto hidden text-sm text-muted-foreground sm:block">Caissier : {cashierName}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="Aucun produit trouvé" />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => (p.variants.length > 0 ? addToCart(p, p.variants[0]) : addToCart(p))}
                  disabled={p.stock <= 0}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left transition-shadow hover:card-shadow-lg disabled:opacity-40",
                  )}
                >
                  <div className="relative aspect-square bg-surface-muted">
                    {p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="120px" className="object-cover" />}
                    {p.stock <= 0 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">Rupture</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-2 text-xs font-medium leading-snug">{p.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-brand-strong">{formatGNF(p.sellingPrice)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden border-l border-border bg-surface lg:block">{cartPanel}</div>

      <button
        onClick={() => setCartOpenMobile(true)}
        className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-2xl bg-brand px-5 py-4 text-brand-foreground shadow-lg lg:hidden"
      >
        <span className="flex items-center gap-2 font-semibold"><ShoppingCart className="size-5" /> {cart.length} article(s)</span>
        <span className="font-bold">{formatGNF(total)}</span>
      </button>

      <Dialog open={cartOpenMobile} onOpenChange={setCartOpenMobile}>
        <DialogContent hideClose className="max-w-md p-0 sm:top-auto sm:bottom-0 sm:translate-y-0 sm:rounded-b-none max-h-[90vh]">
          {cartPanel}
        </DialogContent>
      </Dialog>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Scanner un produit</DialogTitle></DialogHeader>
          <BarcodeScanner onDetected={(code) => { handleBarcode(code); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ventes en attente</DialogTitle></DialogHeader>
          {heldSales.length === 0 ? (
            <EmptyState icon={PauseCircle} title="Aucune vente en attente" />
          ) : (
            <div className="space-y-2">
              {heldSales.map((sale) => (
                <Card key={sale.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{sale.label ?? "Vente"}</p>
                    <p className="text-xs text-muted-foreground">{sale.cartData.length} article(s)</p>
                  </div>
                  <Button size="sm" onClick={() => resumeSale(sale)}>Reprendre</Button>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        items={cart}
        discount={discount}
        total={total}
        customerPhone={customerPhone}
        onSuccess={onCheckoutSuccess}
      />
    </div>
  );
}
