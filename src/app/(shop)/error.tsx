"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function ShopError({
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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={AlertTriangle}
        title="Une erreur est survenue"
        description="Quelque chose s'est mal passé de notre côté. Réessayez, ou revenez un peu plus tard si le problème persiste."
        action={
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" /> Réessayer
          </Button>
        }
      />
    </div>
  );
}
