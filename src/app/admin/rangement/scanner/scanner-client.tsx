"use client";

import * as React from "react";
import Image from "next/image";
import { MapPin, Search } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatGNF } from "@/lib/utils";

type ProductResult = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  imageUrl: string | null;
  variant: { id: string; label: string } | null;
  stock: number;
  locations: { code: string; warehouse: string; quantity: number }[];
};

export function ScannerClient() {
  const [result, setResult] = React.useState<ProductResult | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [manual, setManual] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function lookup(barcode: string) {
    if (!barcode.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(barcode)}`);
      const data = await res.json();
      if (data.found) {
        setResult(data.product);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <BarcodeScanner onDetected={lookup} />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            lookup(manual);
          }}
        >
          <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Ou saisissez un code-barres / SKU" />
          <Button type="submit" variant="outline" loading={loading}><Search className="size-4" /></Button>
        </form>
      </div>

      <div>
        {notFound && <EmptyState icon={Search} title="Produit introuvable" description="Vérifiez le code-barres ou le SKU." />}
        {result && (
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                {result.imageUrl && <Image src={result.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div>
                <p className="font-semibold">{result.name}{result.variant ? ` — ${result.variant.label}` : ""}</p>
                <p className="text-sm text-muted-foreground">{result.sku} · {formatGNF(result.sellingPrice)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><MapPin className="size-4" /> Emplacements ({result.stock} en stock)</p>
              {result.locations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun stock enregistré pour ce produit.</p>
              ) : (
                <div className="space-y-1.5">
                  {result.locations.map((loc) => (
                    <div key={loc.code} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm">
                      <span className="font-mono">{loc.code}</span>
                      <Badge variant="neutral">{loc.quantity} unité(s)</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
        {!result && !notFound && (
          <EmptyState icon={Search} title="Scannez un produit" description="Le résultat apparaîtra ici avec son emplacement exact." />
        )}
      </div>
    </div>
  );
}
