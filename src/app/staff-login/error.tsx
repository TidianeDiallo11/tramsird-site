"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function StaffLoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface-muted px-4 py-10">
      <EmptyState
        icon={AlertTriangle}
        title="Une erreur est survenue"
        description="La page de connexion n'a pas pu se charger. Réessayez."
        action={
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" /> Réessayer
          </Button>
        }
      />
    </main>
  );
}
