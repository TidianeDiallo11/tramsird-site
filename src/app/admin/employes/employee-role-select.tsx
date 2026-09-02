"use client";

import * as React from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/permissions";
import { updateEmployeeRoleAction } from "./actions";
import type { StaffRole } from "@/generated/prisma/enums";

export function EmployeeRoleSelect({ userId, role, disabled }: { userId: string; role: StaffRole; disabled?: boolean }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Select
      value={role}
      disabled={disabled || pending}
      onValueChange={(v) =>
        startTransition(async () => {
          await updateEmployeeRoleAction(userId, v as StaffRole);
          toast.success("Rôle mis à jour");
        })
      }
    >
      <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(ROLE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
