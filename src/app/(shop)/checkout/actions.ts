"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getCustomerSession, createCustomerSession } from "@/lib/session";
import { generateOrderNumber, formatGNF } from "@/lib/utils";
import { initiatePayment } from "@/lib/payments/payment-service";
import { notifyStaff } from "@/lib/notifications";
import { normalizePhone } from "@/lib/phone";
import type { PaymentMethod, DeliveryMethod } from "@/generated/prisma/enums";

export type CheckoutItem = { productId: string; variantId: string | null; quantity: number };

export type CheckoutPayload = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: DeliveryMethod;
  zoneId?: string | null;
  address?: { fullAddress: string; city: string } | null;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  items: CheckoutItem[];
};

export type CheckoutResult =
  | { ok: true; orderId: string; orderNumber: string; paymentStatus: string; message: string; redirectUrl?: string }
  | { ok: false; error: string };

export async function createOrderAction(payload: CheckoutPayload): Promise<CheckoutResult> {
  if (payload.items.length === 0) return { ok: false, error: "Votre panier est vide." };
  if (!payload.customerName.trim() || !payload.customerPhone.trim()) {
    return { ok: false, error: "Nom et téléphone requis." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: payload.items.map((i) => i.productId) } },
    include: { variants: true },
  });

  let subtotal = 0;
  const itemsData = [];
  for (const item of payload.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.active) return { ok: false, error: `Produit indisponible.` };

    const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : null;
    if (item.variantId && !variant) return { ok: false, error: `Variante indisponible pour ${product.name}.` };

    const stockAgg = await prisma.inventory.aggregate({
      where: { productId: product.id, variantId: item.variantId },
      _sum: { quantity: true },
    });
    const available = stockAgg._sum.quantity ?? 0;
    if (available < item.quantity) {
      return { ok: false, error: `Stock insuffisant pour ${product.name} (${available} disponible(s)).` };
    }

    const unitPrice = (product.promoPrice ?? product.sellingPrice) + (variant?.priceDelta ?? 0);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    itemsData.push({
      productId: product.id,
      variantId: item.variantId,
      nameSnapshot: [product.name, variant ? [variant.size, variant.color].filter(Boolean).join(" ") : null]
        .filter(Boolean)
        .join(" — "),
      unitPrice,
      quantity: item.quantity,
      subtotal: lineTotal,
    });
  }

  let discount = 0;
  if (payload.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: payload.couponCode.trim().toUpperCase() },
      include: { promotion: true },
    });
    const now = new Date();
    if (
      coupon &&
      coupon.active &&
      coupon.promotion.active &&
      (!coupon.expiresAt || coupon.expiresAt > now) &&
      coupon.promotion.startDate <= now &&
      coupon.promotion.endDate >= now &&
      (coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit)
    ) {
      discount =
        coupon.promotion.type === "PERCENT"
          ? Math.round((subtotal * coupon.promotion.value) / 100)
          : Math.min(coupon.promotion.value, subtotal);
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  let deliveryFee = 0;
  if (payload.deliveryMethod !== "PICKUP" && payload.zoneId) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id: payload.zoneId } });
    deliveryFee = zone?.fee ?? 0;
  }

  const total = Math.max(0, subtotal - discount + deliveryFee);

  const session = await getCustomerSession();
  let customerId: string;
  let addressId: string | undefined;

  if (session) {
    customerId = session.sub;
  } else {
    const phone = normalizePhone(payload.customerPhone);
    const existing = await prisma.customer.findUnique({ where: { phone } });
    const customer =
      existing ??
      (await prisma.customer.create({
        data: {
          name: payload.customerName,
          phone,
          email: payload.customerEmail || null,
          passwordHash: await hashPassword(Math.random().toString(36).slice(2, 12)),
        },
      }));
    customerId = customer.id;
    await createCustomerSession({ sub: customer.id, name: customer.name, phone: customer.phone });
  }

  if (payload.deliveryMethod !== "PICKUP" && payload.address) {
    const addr = await prisma.address.create({
      data: {
        customerId,
        fullAddress: payload.address.fullAddress,
        city: payload.address.city,
        phone: payload.customerPhone,
      },
    });
    addressId = addr.id;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      channel: "ONLINE",
      customerId,
      addressId,
      deliveryMethod: payload.deliveryMethod,
      status: "NEW",
      subtotal,
      discount,
      deliveryFee,
      total,
      couponCode: payload.couponCode || null,
      items: { create: itemsData },
      statusHistory: { create: { status: "NEW", note: "Commande créée en ligne" } },
    },
  });

  if (payload.deliveryMethod !== "PICKUP") {
    await prisma.shipment.create({
      data: {
        orderId: order.id,
        zoneId: payload.zoneId || null,
        method: payload.deliveryMethod,
        status: "PENDING",
      },
    });
  }

  const { result } = await initiatePayment({
    orderId: order.id,
    method: payload.paymentMethod,
    amount: total,
    customerPhone: payload.customerPhone,
  });

  await notifyStaff("Nouvelle commande reçue", `Commande ${order.orderNumber} — ${formatGNF(total)}.`, "info");

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentStatus: result.status,
    message: result.message,
    redirectUrl: result.redirectUrl,
  };
}
