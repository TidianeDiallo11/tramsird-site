"use client";

import * as React from "react";
import { MoreVertical, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { togglePromotionActiveAction, deletePromotionAction } from "./actions";

export function PromotionActionsMenu({ promotionId, active }: { promotionId: string; active: boolean }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted cursor-pointer"><MoreVertical className="size-4" /></button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => startTransition(async () => { await togglePromotionActiveAction(promotionId); toast.success(active ? "Désactivée" : "Activée"); })}>
            <Power className="size-4" /> {active ? "Désactiver" : "Activer"}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onClick={() => setConfirmOpen(true)}>
            <Trash2 className="size-4" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer cette promotion ?"
        destructive
        confirmLabel="Supprimer"
        loading={pending}
        onConfirm={() => startTransition(async () => { await deletePromotionAction(promotionId); toast.success("Promotion supprimée"); setConfirmOpen(false); })}
      />
    </>
  );
}
