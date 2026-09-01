import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { OpenSessionScreen } from "./open-session";
import { PosClient } from "./pos-client";

export const metadata: Metadata = { title: "Caisse / POS" };

export default async function PosPage() {
  const staffSession = await getStaffSession();
  const posSession = await prisma.posSession.findFirst({
    where: { cashierId: staffSession!.sub, status: "OPEN" },
  });

  if (!posSession) return <OpenSessionScreen />;

  const [products, heldSales] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: { images: { orderBy: { position: "asc" }, take: 1 }, inventory: true, variants: true },
      orderBy: { name: "asc" },
    }),
    prisma.heldSale.findMany({ where: { sessionId: posSession.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    sellingPrice: p.promoPrice ?? p.sellingPrice,
    imageUrl: p.images[0]?.url ?? null,
    stock: p.inventory.reduce((s, i) => s + i.quantity, 0),
    variants: p.variants.map((v) => ({
      id: v.id,
      label: [v.size, v.color].filter(Boolean).join(" "),
      priceDelta: v.priceDelta,
      barcode: v.barcode,
      stock: p.inventory.filter((i) => i.variantId === v.id).reduce((s, i) => s + i.quantity, 0),
    })),
  }));

  return (
    <PosClient
      sessionId={posSession.id}
      cashierName={staffSession!.name}
      canDiscount={hasPermission(staffSession!.role, "pos.discount")}
      products={productData}
      heldSales={heldSales.map((h) => ({ id: h.id, label: h.label, cartData: h.cartData as never, createdAt: h.createdAt.toISOString() }))}
    />
  );
}
