import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

export const getFavoriteProductIds = cache(async (): Promise<Set<string>> => {
  const session = await getCustomerSession();
  if (!session) return new Set();
  const favorites = await prisma.favorite.findMany({
    where: { customerId: session.sub },
    select: { productId: true },
  });
  return new Set(favorites.map((f) => f.productId));
});
