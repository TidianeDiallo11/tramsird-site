"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";

export type SettingsFormState = { error?: string; success?: boolean };

export async function updateStoreSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requirePermission("settings.manage");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;
  const taxRatePct = Number(formData.get("taxRatePct") ?? 0);

  if (!name) return { error: "Le nom de la boutique est obligatoire." };

  const settings = await prisma.storeSettings.findFirst();
  if (settings) {
    await prisma.storeSettings.update({ where: { id: settings.id }, data: { name, phone, email, address, logoUrl, taxRatePct } });
  } else {
    await prisma.storeSettings.create({ data: { name, phone, email, address, logoUrl, taxRatePct } });
  }

  await logAudit({ userId: session.sub, action: "settings.update", entityType: "StoreSettings" });
  revalidatePath("/admin/parametres");
  return { success: true };
}
