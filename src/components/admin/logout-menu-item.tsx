"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { staffLogoutAction } from "@/app/admin/actions";

export function LogoutMenuItem() {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      destructive
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await staffLogoutAction();
        })
      }
    >
      <LogOut className="size-4" /> {pending ? "Déconnexion..." : "Se déconnecter"}
    </DropdownMenuItem>
  );
}
