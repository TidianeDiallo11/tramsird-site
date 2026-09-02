"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string }[];
  name: string;
}) {
  const [active, setActive] = React.useState(0);
  const list = images.length ? images : [{ url: "" }];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted">
        {list[active]?.url ? (
          <Image
            src={list[active].url}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Photo</div>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2">
          {list.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-16 overflow-hidden rounded-xl border-2 bg-surface-muted",
                active === i ? "border-brand" : "border-transparent",
              )}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
