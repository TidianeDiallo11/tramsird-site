"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import { notifyCustomer } from "@/lib/notifications";
import { confirmCashPayment } from "@/lib/payments/payment-service";
import type { OrderStatus } from "@/generated/prisma/enums";

const CUSTOMER_STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Votre commande a été confirmée.",
  SHIPPED: "Votre commande a été expédiée et arrive bientôt.",
  DELIVERED: "Votre commande a été livrée. Merci pour votre confiance !",
  CANCELLED: "Votre commande a été annulée.",
};

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string) {
  const session = await requirePermission("orders.manage");
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  await prisma.orderStatusHistory.create({ data: { orderId, status, note: note ?? `Changé par ${session.name}` } });
  await logAudit({ userId: session.sub, action: "order.status_update", entityType: "Order", entityId: orderId, metadata: { status } });

  const message = CUSTOMER_STATUS_MESSAGES[status];
  if (message && order.customerId) {
    await notifyCustomer(order.customerId, `Commande ${order.orderNumber}`, message, status === "CANCELLED" ? "warning" : "success");
  }

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
}

export async function confirmCashReceivedAction(paymentId: string) {
  const session = await requirePermission("orders.manage");
  const payment = await confirmCashPayment(paymentId);
  await logAudit({ userId: session.sub, action: "payment.cash_confirmed", entityType: "Payment", entityId: paymentId });
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${payment.orderId}`);
}

export async function assignShipmentAction(orderId: string, courierName: string) {
  const session = await requirePermission("delivery.manage");
  await prisma.shipment.update({ where: { orderId }, data: { courierName, status: "ASSIGNED" } });
  await logAudit({ userId: session.sub, action: "shipment.assign", entityType: "Order", entityId: orderId, metadata: { courierName } });
  revalidatePath(`/admin/commandes/${orderId}`);
}
