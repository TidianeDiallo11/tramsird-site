"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteInactiveEmployeesAction } from "./actions";

export function DeleteInactiveEmployeesButton() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" /> Supprimer les désactivés
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Supprimer tous les employés désactivés ?"
        description="Seul le compte administrateur est conservé, quel que soit son état. Action irréversible."
        confirmLabel="Supprimer"
        destructive
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const res = await deleteInactiveEmployeesAction();
            if (res.error) {
              toast.error(res.error);
              return;
            }
            if (res.deletedCount === 0) {
              toast.info("Aucun employé désactivé à supprimer.");
            } else {
              toast.success(`${res.deletedCount} employé(s) supprimé(s).`);
            }
            if (res.skipped.length > 0) {
              toast.error(`${res.skipped.length} employé(s) n'ont pas pu être supprimés : ${res.skipped.map((s) => s.name).join(", ")}.`);
            }
            setOpen(false);
          })
        }
      />
    </>
  );
}
