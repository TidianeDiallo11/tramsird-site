import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { PaymentMethod } from "@/generated/prisma/enums";
import type { ChargeRequest, PaymentProvider } from "@/lib/payments/types";
import { OrangeMoneyProvider } from "@/lib/payments/providers/orange-money";
import { MtnMomoProvider } from "@/lib/payments/providers/mtn-momo";
import { CardProvider } from "@/lib/payments/providers/card";
import { CashProvider } from "@/lib/payments/providers/cash";
import { QrCodeProvider } from "@/lib/payments/providers/qr";

const providers: Record<PaymentMethod, PaymentProvider | null> = {
  ORANGE_MONEY: new OrangeMoneyProvider(),
  MTN_MOMO: new MtnMomoProvider(),
  OTHER_MOMO: new MtnMomoProvider(),
  CARD: new CardProvider(),
  CASH: new CashProvider(),
  QR_CODE: new QrCodeProvider(),
  BANK_TRANSFER: null,
  MIXED: null,
};

export function isMethodConfigured(method: PaymentMethod) {
  return providers[method]?.isConfigured() ?? false;
}

/**
 * Point d'entrée unique pour initier un paiement. Crée toujours une ligne
 * `Payment` (état PENDING) et une trace `PaymentTransaction`, puis délègue
 * au provider correspondant. Le statut ne devient jamais SUCCEEDED ici :
 * seule la confirmation asynchrone (webhook) ou une confirmation humaine
 * explicite (espèces) peut faire passer un paiement à SUCCEEDED.
 */
export async function initiatePayment(params: {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  customerPhone?: string | null;
}) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: params.orderId } });

  const payment = await prisma.payment.create({
    data: { orderId: order.id, method: params.method, amount: params.amount, status: "PENDING" },
  });

  const provider = providers[params.method];
  if (!provider) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { payment, result: { status: "FAILED" as const, message: "Moyen de paiement non pris en charge." } };
  }

  const request: ChargeRequest = {
    paymentId: payment.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: params.amount,
    method: params.method,
    customerPhone: params.customerPhone,
  };

  const result = await provider.initiate(request);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: result.status,
        providerReference: result.providerReference,
        qrToken: params.method === "QR_CODE" ? result.providerReference : undefined,
      },
    }),
    prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        provider: provider.key,
        externalId: result.providerReference,
        status: result.status,
        requestPayload: request as unknown as Prisma.InputJsonValue,
        responsePayload: { message: result.message, raw: result.raw ?? null } as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return { payment: { ...payment, status: result.status }, result };
}

/** Décrémente le stock pour chaque article d'une commande (FIFO par emplacement). */
async function decrementStockForOrder(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  for (const item of order.items) {
    let remaining = item.quantity;
    const rows = await tx.inventory.findMany({
      where: { productId: item.productId, variantId: item.variantId ?? null, quantity: { gt: 0 } },
      orderBy: { quantity: "desc" },
    });
    for (const row of rows) {
      if (remaining <= 0) break;
      const take = Math.min(row.quantity, remaining);
      await tx.inventory.update({ where: { id: row.id }, data: { quantity: { decrement: take } } });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          locationId: row.locationId,
          type: "SALE",
          quantity: take,
          reference: order.orderNumber,
        },
      });
      remaining -= take;
    }
  }
}

async function awardLoyaltyPoints(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.customerId) return;
  const rule = await tx.loyaltyRule.findFirst({ where: { active: true } });
  const gnfPerPoint = rule?.gnfPerPoint ?? 10000;
  const points = Math.floor(order.total / gnfPerPoint);
  if (points <= 0) return;
  await tx.loyaltyTransaction.create({
    data: { customerId: order.customerId, orderId, points, type: "EARN" },
  });
  await tx.customer.update({ where: { id: order.customerId }, data: { loyaltyPoints: { increment: points } } });
}

/** Fait passer un paiement à SUCCEEDED et déclenche les effets métier (stock, statut, fidélité). */
export async function markPaymentSucceeded(paymentId: string, providerReference?: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCEEDED", providerReference },
    });

    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    const alreadyProcessed = ["PAID", "PREPARING", "READY", "SHIPPED", "DELIVERED"].includes(order.status);

    await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });
    await tx.orderStatusHistory.create({
      data: { orderId: payment.orderId, status: "PAID", note: "Paiement confirmé" },
    });

    if (!alreadyProcessed) {
      await decrementStockForOrder(tx, payment.orderId);
      await awardLoyaltyPoints(tx, payment.orderId);
    }

    return payment;
  });
}

export async function markPaymentFailed(paymentId: string) {
  return prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
}

/** Confirmation humaine d'un paiement en espèces (caisse ou livraison). */
export async function confirmCashPayment(paymentId: string) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.method !== "CASH") {
    throw new Error("Ce paiement n'est pas un paiement en espèces.");
  }
  return markPaymentSucceeded(paymentId);
}
