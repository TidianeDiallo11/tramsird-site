"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import type { ShipmentStatus } from "@/generated/prisma/enums";

export type ZoneFormState = { error?: string; success?: boolean };

export async function saveZoneAction(_prev: ZoneFormState, formData: FormData): Promise<ZoneFormState> {
  const session = await requirePermission("delivery.manage");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const fee = Number(formData.get("fee") ?? 0);
  const estimatedDays = Number(formData.get("estimatedDays") ?? 1);

  if (!name) return { error: "Le nom de la zone est obligatoire." };

  if (id) {
    await prisma.deliveryZone.update({ where: { id }, data: { name, fee, estimatedDays } });
  } else {
    await prisma.deliveryZone.create({ data: { name, fee, estimatedDays } });
  }
  await logAudit({ userId: session.sub, action: "delivery_zone.save", entityType: "DeliveryZone", entityId: id });
  revalidatePath("/admin/livraisons");
  return { success: true };
}

export async function toggleZoneActiveAction(zoneId: string) {
  await requirePermission("delivery.manage");
  const zone = await prisma.deliveryZone.findUniqueOrThrow({ where: { id: zoneId } });
  await prisma.deliveryZone.update({ where: { id: zoneId }, data: { active: !zone.active } });
  revalidatePath("/admin/livraisons");
}

export async function updateShipmentStatusAction(orderId: string, status: ShipmentStatus, courierName?: string) {
  const session = await requirePermission("delivery.update_status");
  await prisma.shipment.update({ where: { orderId }, data: { status, courierName, ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}) } });
  if (status === "DELIVERED") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
    await prisma.orderStatusHistory.create({ data: { orderId, status: "DELIVERED", note: `Livré (${session.name})` } });
  }
  await logAudit({ userId: session.sub, action: "shipment.status_update", entityType: "Order", entityId: orderId, metadata: { status } });
  revalidatePath("/admin/livraisons");
}
