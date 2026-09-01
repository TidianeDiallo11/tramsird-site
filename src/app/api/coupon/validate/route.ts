import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { code, subtotal } = (await request.json()) as { code?: string; subtotal?: number };
  if (!code) {
    return NextResponse.json({ valid: false, message: "Code manquant." }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { promotion: true },
  });

  if (!coupon || !coupon.active || !coupon.promotion.active) {
    return NextResponse.json({ valid: false, message: "Code promo invalide." });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: "Ce code promo a expiré." });
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return NextResponse.json({ valid: false, message: "Ce code promo a atteint sa limite d'utilisation." });
  }
  const now = new Date();
  if (coupon.promotion.startDate > now || coupon.promotion.endDate < now) {
    return NextResponse.json({ valid: false, message: "Ce code promo n'est plus actif." });
  }

  const amount = subtotal ?? 0;
  const discount =
    coupon.promotion.type === "PERCENT"
      ? Math.round((amount * coupon.promotion.value) / 100)
      : Math.min(coupon.promotion.value, amount);

  return NextResponse.json({ valid: true, discount, code: coupon.code });
}
