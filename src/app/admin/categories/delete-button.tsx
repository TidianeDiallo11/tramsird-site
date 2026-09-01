"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="size-4 text-danger" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Supprimer cette catégorie ?"
        confirmLabel="Supprimer"
        destructive
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deleteCategoryAction(categoryId);
            if (res?.error) toast.error(res.error);
            else {
              toast.success("Catégorie supprimée");
              setOpen(false);
            }
          })
        }
      />
    </>
  );
}
