"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import type { MovementType } from "@/generated/prisma/enums";

export type StockFormState = { error?: string; success?: boolean };

async function upsertInventory(productId: string, variantId: string | null, locationId: string, delta: number) {
  const existing = await prisma.inventory.findFirst({
    where: { productId, variantId, locationId },
  });
  if (existing) {
    const newQty = existing.quantity + delta;
    if (newQty < 0) throw new Error("Stock insuffisant à cet emplacement.");
    await prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    if (delta < 0) throw new Error("Stock insuffisant à cet emplacement.");
    await prisma.inventory.create({ data: { productId, variantId, locationId, quantity: delta } });
  }
}

export async function adjustStockAction(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  const session = await requirePermission("stock.adjust");

  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "") || null;
  const type = String(formData.get("type") ?? "") as MovementType;
  const locationId = String(formData.get("locationId") ?? "");
  const destinationLocationId = String(formData.get("destinationLocationId") ?? "") || null;
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!productId || !locationId || !quantity || quantity <= 0) {
    return { error: "Emplacement et quantité (positive) sont obligatoires." };
  }
  if (type === "TRANSFER" && !destinationLocationId) {
    return { error: "Sélectionnez l'emplacement de destination pour un transfert." };
  }

  try {
    if (type === "IN" || type === "RESTOCK" || type === "RETURN") {
      await upsertInventory(productId, variantId, locationId, quantity);
    } else if (type === "OUT") {
      await upsertInventory(productId, variantId, locationId, -quantity);
    } else if (type === "ADJUSTMENT") {
      const existing = await prisma.inventory.findFirst({
        where: { productId, variantId, locationId },
      });
      const delta = quantity - (existing?.quantity ?? 0);
      await upsertInventory(productId, variantId, locationId, delta);
    } else if (type === "TRANSFER" && destinationLocationId) {
      await upsertInventory(productId, variantId, locationId, -quantity);
      await upsertInventory(productId, variantId, destinationLocationId, quantity);
    }

    await prisma.inventoryMovement.create({
      data: { productId, variantId, locationId, type, quantity, reason, userId: session.sub },
    });
    if (type === "TRANSFER" && destinationLocationId) {
      await prisma.inventoryMovement.create({
        data: {
          productId,
          variantId,
          locationId: destinationLocationId,
          type: "TRANSFER",
          quantity,
          reason: reason ?? "Transfert entrant",
          userId: session.sub,
        },
      });
    }

    await logAudit({
      userId: session.sub,
      action: "stock.movement",
      entityType: "Product",
      entityId: productId,
      metadata: { type, quantity, locationId, destinationLocationId },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de l'ajustement du stock." };
  }

  revalidatePath("/admin/stock");
  revalidatePath("/admin/rangement");
  return { success: true };
}
