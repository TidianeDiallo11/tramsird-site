"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "", label: "Tous" },
  { value: "NEW", label: "Nouvelle" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "PAID", label: "Payée" },
  { value: "PREPARING", label: "En préparation" },
  { value: "READY", label: "Prête" },
  { value: "SHIPPED", label: "Expédiée" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "CANCELLED", label: "Annulée" },
];

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("statut") ?? "";

  function setStatus(value: string) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set("statut", value);
    else sp.delete("statut");
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => setStatus(s.value)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium",
            current === s.value ? "bg-brand text-brand-foreground" : "bg-surface-muted text-muted-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
