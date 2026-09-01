"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import type { PromotionType } from "@/generated/prisma/enums";

export type PromoFormState = { error?: string; success?: boolean };

export async function savePromotionAction(_prev: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const session = await requirePermission("promotions.manage");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "PERCENT") as PromotionType;
  const value = Number(formData.get("value") ?? 0);
  const productId = String(formData.get("productId") ?? "") || null;
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const startDate = new Date(String(formData.get("startDate") ?? new Date().toISOString()));
  const endDate = new Date(String(formData.get("endDate") ?? new Date().toISOString()));
  const usageLimitRaw = formData.get("usageLimit");
  const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null;
  const couponCode = String(formData.get("couponCode") ?? "").trim().toUpperCase();

  if (!name || !value) return { error: "Nom et valeur sont obligatoires." };
  if (endDate < startDate) return { error: "La date de fin doit être après la date de début." };

  const promo = await prisma.promotion.create({
    data: { name, type, value, productId, categoryId, startDate, endDate, usageLimit },
  });

  if (couponCode) {
    await prisma.coupon.create({ data: { code: couponCode, promotionId: promo.id, usageLimit } });
  }

  await logAudit({ userId: session.sub, action: "promotion.create", entityType: "Promotion", entityId: promo.id });
  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function togglePromotionActiveAction(promotionId: string) {
  await requirePermission("promotions.manage");
  const promo = await prisma.promotion.findUniqueOrThrow({ where: { id: promotionId } });
  await prisma.promotion.update({ where: { id: promotionId }, data: { active: !promo.active } });
  revalidatePath("/admin/promotions");
}

export async function deletePromotionAction(promotionId: string) {
  const session = await requirePermission("promotions.manage");
  await prisma.promotion.delete({ where: { id: promotionId } });
  await logAudit({ userId: session.sub, action: "promotion.delete", entityType: "Promotion", entityId: promotionId });
  revalidatePath("/admin/promotions");
}
