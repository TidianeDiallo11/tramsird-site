"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function PayError({
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
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 py-10">
      <EmptyState
        icon={AlertTriangle}
        title="Une erreur est survenue"
        description="La page de paiement n'a pas pu se charger. Réessayez, ou contactez le vendeur si le problème persiste."
        action={
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" /> Réessayer
          </Button>
        }
      />
    </div>
  );
}
