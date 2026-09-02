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

export function OrderTimeline({
  currentStatus,
  history,
}: {
  currentStatus: OrderStatus;
  history: { status: OrderStatus; createdAt: Date; note: string | null }[];
}) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="rounded-xl bg-danger-soft p-4 text-sm text-danger">
        Cette commande a été annulée.
      </div>
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
