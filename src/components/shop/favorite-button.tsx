"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleFavoriteAction } from "@/lib/favorites-actions";

export function FavoriteButton({
  productId,
  initialFavorited = false,
  className,
}: {
  productId: string;
  initialFavorited?: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId);
      if (!result.ok) {
        toast.info("Connectez-vous pour ajouter des favoris.");
        router.push("/connexion");
        return;
      }
      setFavorited(result.favorited);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-sm transition-colors",
        favorited ? "text-danger" : "text-muted-foreground opacity-0 group-hover:opacity-100",
        className,
      )}
      aria-label="Ajouter aux favoris"
    >
      <Heart className="size-4" fill={favorited ? "currentColor" : "none"} />
    </button>
  );
}
