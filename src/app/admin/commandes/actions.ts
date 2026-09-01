"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import type { OrderStatus } from "@/generated/prisma/enums";

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string) {
  const session = await requirePermission("orders.manage");
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderStatusHistory.create({ data: { orderId, status, note: note ?? `Changé par ${session.name}` } }),
  ]);
  await logAudit({ userId: session.sub, action: "order.status_update", entityType: "Order", entityId: orderId, metadata: { status } });
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
}

export async function assignShipmentAction(orderId: string, courierName: string) {
  const session = await requirePermission("delivery.manage");
  await prisma.shipment.update({ where: { orderId }, data: { courierName, status: "ASSIGNED" } });
  await logAudit({ userId: session.sub, action: "shipment.assign", entityType: "Order", entityId: orderId, metadata: { courierName } });
  revalidatePath(`/admin/commandes/${orderId}`);
}
