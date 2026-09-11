import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getStoreBranding = cache(async () => {
  try {
    const settings = await prisma.storeSettings.findFirst();
    return {
      name: settings?.name ?? "ShopFlow",
      logoUrl: settings?.logoUrl ?? null,
    };
  } catch {
    // Statically-generated routes (e.g. /_not-found) can render at build time,
    // before a database is reachable. Fall back rather than fail the build.
    return { name: "ShopFlow", logoUrl: null as string | null };
  }
});
