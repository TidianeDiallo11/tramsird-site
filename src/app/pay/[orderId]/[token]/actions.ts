"use server";

import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payments/payment-service";
import type { PaymentMethod } from "@/generated/prisma/enums";

export async function payWithMethodAction(orderId: string, method: PaymentMethod) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const { result } = await initiatePayment({ orderId: order.id, method, amount: order.total });
  return { status: result.status, message: result.message, redirectUrl: result.redirectUrl };
}
