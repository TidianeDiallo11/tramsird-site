"use client";

import * as React from "react";
import { MoreVertical, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toggleProductActiveAction, deleteProductAction } from "./actions";

export function ProductRowActions({
  productId,
  active,
  canEdit,
  canDelete,
}: {
  productId: string;
  active: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted cursor-pointer">
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem
              onClick={() =>
                startTransition(async () => {
                  await toggleProductActiveAction(productId);
                  toast.success(active ? "Produit désactivé" : "Produit activé");
                })
              }
            >
              <Power className="size-4" /> {active ? "Désactiver" : "Activer"}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem destructive onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Supprimer
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer ce produit ?"
        description="Cette action est irréversible et supprimera aussi son historique de stock associé."
        confirmLabel="Supprimer"
        destructive
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteProductAction(productId);
            toast.success("Produit supprimé");
            setConfirmDelete(false);
          })
        }
      />
    </>
  );
}
