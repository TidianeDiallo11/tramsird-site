"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";

export type LoyaltyFormState = { error?: string; success?: boolean };

export async function updateLoyaltyRuleAction(
  _prev: LoyaltyFormState,
  formData: FormData,
): Promise<LoyaltyFormState> {
  const session = await requirePermission("loyalty.manage");
  const gnfPerPoint = Number(formData.get("gnfPerPoint") ?? 0);
  if (!gnfPerPoint || gnfPerPoint < 100) return { error: "Le montant doit être d'au moins 100 GNF." };

  const rule = await prisma.loyaltyRule.findFirst();
  if (rule) {
    await prisma.loyaltyRule.update({ where: { id: rule.id }, data: { gnfPerPoint } });
  } else {
    await prisma.loyaltyRule.create({ data: { gnfPerPoint } });
  }

  await logAudit({ userId: session.sub, action: "loyalty_rule.update", entityType: "LoyaltyRule", metadata: { gnfPerPoint } });
  revalidatePath("/admin/fidelite");
  return { success: true };
}
