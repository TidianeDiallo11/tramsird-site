"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <EmptyState
      icon={AlertTriangle}
      title="Une erreur est survenue"
      description="Cette page n'a pas pu se charger correctement. Réessayez, ou revenez un peu plus tard si le problème persiste."
      action={
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="size-4" /> Réessayer
        </Button>
      }
      className="mt-8"
    />
  );
}
