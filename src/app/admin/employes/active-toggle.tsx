"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleEmployeeActiveAction } from "./actions";

export function EmployeeActiveToggle({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={() =>
        startTransition(async () => {
          await toggleEmployeeActiveAction(userId);
          toast.success(active ? "Compte désactivé" : "Compte activé");
        })
      }
    />
  );
}
