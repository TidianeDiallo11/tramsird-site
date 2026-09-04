"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, hashPassword, logAudit } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { generateOrderNumber } from "@/lib/utils";
import { initiatePayment, confirmCashPayment } from "@/lib/payments/payment-service";
import { normalizePhone } from "@/lib/phone";
import type { PaymentMethod } from "@/generated/prisma/enums";

export async function openPosSessionAction(openingCash: number) {
  const session = await requirePermission("pos.sell");
  const existing = await prisma.posSession.findFirst({ where: { cashierId: session.sub, status: "OPEN" } });
  if (existing) return existing;
  const created = await prisma.posSession.create({ data: { cashierId: session.sub, openingCash } });
  revalidatePath("/pos");
  return created;
}

export async function closePosSessionAction(sessionId: string, closingCash: number) {
  const session = await requirePermission("pos.sell");
  await prisma.posSession.update({
    where: { id: sessionId, cashierId: session.sub },
    data: { status: "CLOSED", closingCash, closedAt: new Date() },
  });
  revalidatePath("/pos");
}

export type PosCartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
};

export async function holdSaleAction(sessionId: string, label: string, cartData: PosCartItem[]) {
  await requirePermission("pos.sell");
  await prisma.heldSale.create({ data: { sessionId, label, cartData: cartData as never } });
  revalidatePath("/pos");
}

export async function deleteHeldSaleAction(heldSaleId: string) {
  await requirePermission("pos.sell");
  await prisma.heldSale.delete({ where: { id: heldSaleId } });
  revalidatePath("/pos");
}

export type PosCheckoutPayload = {
  items: PosCartItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  cashSplitAmount?: number;
  secondMethod?: PaymentMethod;
};

export type PosCheckoutResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      total: number;
      paymentStatus: string;
      message: string;
    }
  | { ok: false; error: string };

export async function checkoutPosAction(payload: PosCheckoutPayload): Promise<PosCheckoutResult> {
  const session = await requirePermission("pos.sell");
  if (payload.items.length === 0) return { ok: false, error: "Le panier est vide." };
  if (payload.discount > 0 && !hasPermission(session.role, "pos.discount")) {
    return { ok: false, error: "Vous n'êtes pas autorisé à appliquer une remise." };
  }

  // Vérification du stock en temps réel avant encaissement
  for (const item of payload.items) {
    const stock = await prisma.inventory.aggregate({
      where: { productId: item.productId, variantId: item.variantId },
      _sum: { quantity: true },
    });
    if ((stock._sum.quantity ?? 0) < item.quantity) {
      return { ok: false, error: `Stock insuffisant pour ${item.name}.` };
    }
  }

  const subtotal = payload.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - payload.discount);

  let customerId: string | undefined;
  if (payload.customerPhone) {
    const phone = normalizePhone(payload.customerPhone);
    const existing = await prisma.customer.findUnique({ where: { phone } });
    customerId =
      existing?.id ??
      (
        await prisma.customer.create({
          data: {
            name: `Client ${phone}`,
            phone,
            passwordHash: await hashPassword(Math.random().toString(36).slice(2, 12)),
          },
        })
      ).id;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      channel: "POS",
      customerId,
      employeeId: session.sub,
      deliveryMethod: "PICKUP",
      status: "NEW",
      subtotal,
      discount: payload.discount,
      total,
      items: {
        create: payload.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          nameSnapshot: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          subtotal: i.unitPrice * i.quantity,
        })),
      },
      statusHistory: { create: { status: "NEW", note: `Vente en caisse par ${session.name}` } },
    },
  });

  await logAudit({ userId: session.sub, action: "pos.sale", entityType: "Order", entityId: order.id, metadata: { total } });

  const isSplitCash = payload.paymentMethod === "MIXED" && payload.cashSplitAmount;

  if (isSplitCash && payload.secondMethod) {
    const cashAmount = Math.min(payload.cashSplitAmount!, total);
    const remainder = total - cashAmount;
    const cashPayment = await initiatePayment({ orderId: order.id, method: "CASH", amount: cashAmount });
    await confirmCashPayment(cashPayment.payment.id);
    if (remainder > 0) {
      const { result } = await initiatePayment({
        orderId: order.id,
        method: payload.secondMethod,
        amount: remainder,
        customerPhone: payload.customerPhone,
      });
      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
        paymentStatus: result.status,
        message: `Espèces confirmées (${cashAmount} GNF). ${result.message}`,
      };
    }
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber, total, paymentStatus: "SUCCEEDED", message: "Paiement mixte confirmé." };
  }

  const { payment, result } = await initiatePayment({
    orderId: order.id,
    method: payload.paymentMethod,
    amount: total,
    customerPhone: payload.customerPhone,
  });

  if (payload.paymentMethod === "CASH") {
    await confirmCashPayment(payment.id);
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber, total, paymentStatus: "SUCCEEDED", message: "Paiement en espèces confirmé." };
  }

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total,
    paymentStatus: result.status,
    message: result.message,
  };
}
