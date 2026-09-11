"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, MapPin, Store, Truck, Wallet } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatGNF, cn } from "@/lib/utils";
import { createOrderAction } from "./actions";
import type { DeliveryMethod, PaymentMethod } from "@/generated/prisma/enums";

type Zone = { id: string; name: string; fee: number; estimatedDays: number };

const STEPS = ["Informations", "Adresse", "Livraison", "Paiement", "Confirmation"] as const;

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string; hint: string }[] = [
  { value: "CASH", label: "Espèces à la livraison / au retrait", icon: "💵", hint: "Payez quand vous recevez votre commande." },
  { value: "ORANGE_MONEY", label: "Orange Money", icon: "🟠", hint: "Paiement mobile Orange." },
];

export function CheckoutWizard({
  zones,
  defaultName,
  defaultPhone,
}: {
  zones: Zone[];
  defaultName?: string;
  defaultPhone?: string;
}) {
  const { items, subtotal, couponCode, clear } = useCart();
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [orderResult, setOrderResult] = React.useState<{ orderNumber: string; message: string; status: string } | null>(null);

  const [name, setName] = React.useState(defaultName ?? "");
  const [phone, setPhone] = React.useState(defaultPhone ?? "");
  const [email, setEmail] = React.useState("");
  const [deliveryMethod, setDeliveryMethod] = React.useState<DeliveryMethod>("PICKUP");
  const [zoneId, setZoneId] = React.useState<string>(zones[0]?.id ?? "");
  const [fullAddress, setFullAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("CASH");

  const selectedZone = zones.find((z) => z.id === zoneId);
  const deliveryFee = deliveryMethod === "PICKUP" ? 0 : (selectedZone?.fee ?? 0);
  const total = Math.max(0, subtotal - 0 + deliveryFee);

  function canProceed() {
    if (step === 0) return name.trim().length > 1 && phone.trim().length >= 8;
    if (step === 1) return deliveryMethod === "PICKUP" || (fullAddress.trim().length > 3 && city.trim().length > 1);
    if (step === 2) return true;
    return true;
  }

  async function submit() {
    setSubmitting(true);
    try {
      const result = await createOrderAction({
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        deliveryMethod,
        zoneId: deliveryMethod === "PICKUP" ? null : zoneId,
        address: deliveryMethod === "PICKUP" ? null : { fullAddress, city },
        paymentMethod,
        couponCode,
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      clear();
      setOrderResult({ orderNumber: result.orderNumber, message: result.message, status: result.paymentStatus });
      setStep(4);

      if (result.redirectUrl) {
        setTimeout(() => router.push(result.redirectUrl!), 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !orderResult) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold">Votre panier est vide</p>
        <p className="mt-1 text-sm text-muted-foreground">Ajoutez des produits avant de passer commande.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <ol className="mb-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-1">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  i < step ? "bg-success text-white" : i === step ? "bg-brand text-brand-foreground" : "bg-surface-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-border sm:w-8" />}
            </li>
          ))}
        </ol>

        <Card className="p-5 sm:p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Vos informations</h2>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="622 00 00 00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Mode de réception</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  icon={Store}
                  title="Retrait en magasin"
                  desc="Gratuit — Boulevard du Commerce, Kaloum"
                  active={deliveryMethod === "PICKUP"}
                  onClick={() => setDeliveryMethod("PICKUP")}
                />
                <OptionCard
                  icon={Truck}
                  title="Livraison"
                  desc="Choisissez votre zone à l'étape suivante"
                  active={deliveryMethod !== "PICKUP"}
                  onClick={() => setDeliveryMethod("STANDARD")}
                />
              </div>

              {deliveryMethod !== "PICKUP" && (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="space-y-1.5">
                    <Label>Zone de livraison</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {zones.map((z) => (
                        <button
                          key={z.id}
                          onClick={() => setZoneId(z.id)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left text-sm",
                            zoneId === z.id ? "border-brand bg-brand-soft" : "border-border",
                          )}
                        >
                          <span className="font-medium">{z.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {formatGNF(z.fee)} · {z.estimatedDays}j
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Adresse complète</Label>
                    <Input id="address" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Quartier, rue, repère" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ville / Commune</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Conakry" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Récapitulatif de livraison</h2>
              <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-4">
                {deliveryMethod === "PICKUP" ? <Store className="size-5 text-brand" /> : <MapPin className="size-5 text-brand" />}
                <div className="text-sm">
                  <p className="font-medium">{deliveryMethod === "PICKUP" ? "Retrait en magasin" : `Livraison — ${selectedZone?.name}`}</p>
                  <p className="text-muted-foreground">
                    {deliveryMethod === "PICKUP" ? "Boulevard du Commerce, Kaloum" : `${fullAddress}, ${city}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Moyen de paiement</h2>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left",
                      paymentMethod === opt.value ? "border-brand bg-brand-soft" : "border-border",
                    )}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                    </span>
                    {paymentMethod === opt.value && <Check className="size-4 text-brand" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && orderResult && (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-7" />
              </div>
              <h2 className="text-lg font-bold">Commande {orderResult.orderNumber} confirmée</h2>
              <p className="text-sm text-muted-foreground">{orderResult.message}</p>
              <Button className="mt-2" onClick={() => router.push(`/compte/commandes/${orderResult.orderNumber}`)}>
                Suivre ma commande
              </Button>
            </div>
          )}

          {step < 4 && (
            <div className="mt-6 flex justify-between border-t border-border pt-4">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                Retour
              </Button>
              {step < 3 ? (
                <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
                  Continuer
                </Button>
              ) : (
                <Button onClick={submit} loading={submitting} className="gap-2">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
                  Confirmer la commande
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="h-fit space-y-3 p-5">
        <h2 className="font-semibold">Votre commande</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={`${item.productId}-${item.variantId}`} className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                {item.quantity}× {item.name}
              </span>
              <span>{formatGNF(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatGNF(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span>{formatGNF(deliveryFee)}</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatGNF(total)}</span>
        </div>
      </Card>
    </div>
  );
}

function OptionCard({
  icon: Icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: typeof Store;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        active ? "border-brand bg-brand-soft" : "border-border hover:border-border-strong",
      )}
    >
      <Icon className={cn("size-5 shrink-0", active ? "text-brand-strong" : "text-muted-foreground")} />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
