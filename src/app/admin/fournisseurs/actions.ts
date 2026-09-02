"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";

export type SupplierFormState = { error?: string; success?: boolean };

export async function saveSupplierAction(
  _prev: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  const session = await requirePermission("suppliers.manage");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { error: "Le nom du fournisseur est obligatoire." };

  if (id) {
    await prisma.supplier.update({ where: { id }, data: { name, phone, email, address, notes } });
    await logAudit({ userId: session.sub, action: "supplier.update", entityType: "Supplier", entityId: id });
  } else {
    const created = await prisma.supplier.create({ data: { name, phone, email, address, notes } });
    await logAudit({ userId: session.sub, action: "supplier.create", entityType: "Supplier", entityId: created.id });
  }

  revalidatePath("/admin/fournisseurs");
  return { success: true };
}

export async function createPurchaseOrderAction(
  supplierId: string,
  items: { productId: string; quantity: number; unitCost: number }[],
) {
  const session = await requirePermission("suppliers.manage");
  if (items.length === 0) return { error: "Ajoutez au moins un article." };

  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      status: "ORDERED",
      totalCost,
      items: { create: items },
    },
  });
  await logAudit({ userId: session.sub, action: "purchase_order.create", entityType: "PurchaseOrder", entityId: po.id });
  revalidatePath(`/admin/fournisseurs/${supplierId}`);
  return { success: true, id: po.id };
}

export async function receivePurchaseOrderAction(purchaseOrderId: string, locationId: string) {
  const session = await requirePermission("suppliers.manage");
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: purchaseOrderId },
    include: { items: true },
  });
  if (po.status === "RECEIVED") return;

  await prisma.$transaction(async (tx) => {
    for (const item of po.items) {
      const existing = await tx.inventory.findFirst({
        where: { productId: item.productId, variantId: item.variantId, locationId },
      });
      if (existing) {
        await tx.inventory.update({ where: { id: existing.id }, data: { quantity: { increment: item.quantity } } });
      } else {
        await tx.inventory.create({ data: { productId: item.productId, variantId: item.variantId, locationId, quantity: item.quantity } });
      }
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          locationId,
          type: "RESTOCK",
          quantity: item.quantity,
          reason: `Réception commande fournisseur`,
          reference: po.id,
          userId: session.sub,
        },
      });
    }
    await tx.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "RECEIVED", receivedAt: new Date() } });
  });

  await logAudit({ userId: session.sub, action: "purchase_order.receive", entityType: "PurchaseOrder", entityId: purchaseOrderId });
  revalidatePath(`/admin/fournisseurs/${po.supplierId}`);
  revalidatePath("/admin/stock");
}
