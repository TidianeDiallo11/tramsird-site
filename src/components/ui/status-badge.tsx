import { Badge } from "@/components/ui/badge";

const ORDER_STATUS: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  NEW: { label: "Nouvelle", variant: "info" },
  CONFIRMED: { label: "Confirmée", variant: "info" },
  PAID: { label: "Payée", variant: "success" },
  PREPARING: { label: "En préparation", variant: "warning" },
  READY: { label: "Prête", variant: "warning" },
  SHIPPED: { label: "Expédiée", variant: "default" },
  DELIVERED: { label: "Livrée", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "danger" },
};

const PAYMENT_STATUS: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  PENDING: { label: "En attente", variant: "warning" },
  PROCESSING: { label: "En cours", variant: "info" },
  SUCCEEDED: { label: "Réussi", variant: "success" },
  FAILED: { label: "Échoué", variant: "danger" },
  CANCELLED: { label: "Annulé", variant: "neutral" },
  REFUNDED: { label: "Remboursé", variant: "outline" },
};

const STOCK_STATUS: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  NORMAL: { label: "Stock normal", variant: "success" },
  LOW: { label: "Stock faible", variant: "warning" },
  OUT: { label: "Rupture", variant: "danger" },
};

const SHIPMENT_STATUS: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  PENDING: { label: "En attente", variant: "neutral" },
  ASSIGNED: { label: "Assignée", variant: "info" },
  IN_TRANSIT: { label: "En route", variant: "warning" },
  DELIVERED: { label: "Livrée", variant: "success" },
  FAILED: { label: "Échec", variant: "danger" },
};

const PO_STATUS: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  DRAFT: { label: "Brouillon", variant: "neutral" },
  ORDERED: { label: "Commandée", variant: "info" },
  RECEIVED: { label: "Reçue", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "danger" },
};

const MAPS = {
  order: ORDER_STATUS,
  payment: PAYMENT_STATUS,
  stock: STOCK_STATUS,
  shipment: SHIPMENT_STATUS,
  purchaseOrder: PO_STATUS,
} as const;

export function StatusBadge({
  status,
  type,
  className,
}: {
  status: string;
  type: keyof typeof MAPS;
  className?: string;
}) {
  const map = MAPS[type];
  const entry = map[status] ?? { label: status, variant: "neutral" as const };
  return (
    <Badge variant={entry.variant} dot className={className}>
      {entry.label}
    </Badge>
  );
}

export function stockStatusFor(quantity: number, threshold: number): "NORMAL" | "LOW" | "OUT" {
  if (quantity <= 0) return "OUT";
  if (quantity <= threshold) return "LOW";
  return "NORMAL";
}
