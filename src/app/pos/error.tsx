"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function PosError({
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
    <div className="flex h-svh items-center justify-center p-6">
      <EmptyState
        icon={AlertTriangle}
        title="Une erreur est survenue"
        description="La caisse n'a pas pu se charger correctement. Réessayez."
        action={
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" /> Réessayer
          </Button>
        }
      />
    </div>
  );
}
