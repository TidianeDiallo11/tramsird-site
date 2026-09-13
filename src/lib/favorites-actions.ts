"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

export async function toggleFavoriteAction(productId: string) {
  const session = await getCustomerSession();
  if (!session) {
    return { ok: false as const, requiresAuth: true as const };
  }

  const existing = await prisma.favorite.findUnique({
    where: { customerId_productId: { customerId: session.sub, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/compte/favoris");
    return { ok: true as const, favorited: false };
  }

  await prisma.favorite.create({ data: { customerId: session.sub, productId } });
  revalidatePath("/compte/favoris");
  return { ok: true as const, favorited: true };
}
