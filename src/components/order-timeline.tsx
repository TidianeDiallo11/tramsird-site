import { Check } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

const FLOW: OrderStatus[] = ["NEW", "CONFIRMED", "PAID", "PREPARING", "READY", "SHIPPED", "DELIVERED"];

const LABELS: Record<OrderStatus, string> = {
  NEW: "Nouvelle",
  CONFIRMED: "Confirmée",
  PAID: "Payée",
  PREPARING: "En préparation",
  READY: "Prête",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

// Les statuts internes (utilisés côté admin) sont plus granulaires que ce
// dont un client a besoin de voir : on les regroupe en 4 étapes claires.
const STAGES: { label: string; reassurance: string; statuses: OrderStatus[] }[] = [
  {
    label: "Commande reçue",
    reassurance: "Nous avons bien reçu votre commande.",
    statuses: ["NEW", "CONFIRMED", "PAID"],
  },
  {
    label: "En préparation",
    reassurance: "Votre commande est en cours de préparation.",
    statuses: ["PREPARING"],
  },
  {
    label: "Prête / en route",
    reassurance: "Votre commande est prête et arrive bientôt.",
    statuses: ["READY", "SHIPPED"],
  },
  {
    label: "Livrée",
    reassurance: "Votre commande a été livrée. Merci pour votre confiance !",
    statuses: ["DELIVERED"],
  },
];

type HistoryEntry = { status: OrderStatus; createdAt: Date; note: string | null };

export function OrderTimeline({
  currentStatus,
  history,
  simplified = false,
}: {
  currentStatus: OrderStatus;
  history: HistoryEntry[];
  /** Vue simplifiée à 4 étapes avec message rassurant, pour le client (au lieu des 7 statuts internes). */
  simplified?: boolean;
}) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="rounded-xl bg-danger-soft p-4 text-sm text-danger">
        Cette commande a été annulée.
      </div>
    );
  }

  if (simplified) {
    const currentStageIdx = STAGES.findIndex((s) => s.statuses.includes(currentStatus));
    const historyMap = new Map(history.map((h) => [h.status, h]));

    return (
      <ol className="space-y-0">
        {STAGES.map((stage, i) => {
          const done = i <= currentStageIdx;
          const current = i === currentStageIdx;
          const entry = stage.statuses.map((s) => historyMap.get(s)).find(Boolean);
          return (
            <li key={stage.label} className="relative flex gap-3 pb-6 last:pb-0">
              {i < STAGES.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[13px] top-7 h-full w-0.5",
                    done && i < currentStageIdx ? "bg-success" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-success text-white" : "bg-surface-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <div className="pt-0.5">
                <p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>{stage.label}</p>
                {entry && <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>}
                {current && <p className="mt-0.5 text-xs text-success">{stage.reassurance}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  const currentIdx = FLOW.indexOf(currentStatus);
  const historyMap = new Map(history.map((h) => [h.status, h]));

  return (
    <ol className="space-y-0">
      {FLOW.map((status, i) => {
        const done = i <= currentIdx;
        const entry = historyMap.get(status);
        return (
          <li key={status} className="relative flex gap-3 pb-6 last:pb-0">
            {i < FLOW.length - 1 && (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-full w-0.5",
                  done && i < currentIdx ? "bg-success" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                done ? "bg-success text-white" : "bg-surface-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>{LABELS[status]}</p>
              {entry && <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
