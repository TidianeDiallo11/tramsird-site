import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode")?.trim();
  const q = searchParams.get("q")?.trim();
  if (!barcode && !q) return NextResponse.json({ error: "missing_query" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: barcode
      ? { OR: [{ barcode }, { sku: barcode }, { variants: { some: { barcode } } }] }
      : {
          OR: [
            { name: { contains: q!, mode: "insensitive" } },
            { sku: { contains: q!, mode: "insensitive" } },
            { barcode: { contains: q!, mode: "insensitive" } },
          ],
        },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: true,
      inventory: { include: { location: { include: { warehouse: true } } } },
    },
  });

  if (!product) return NextResponse.json({ found: false });

  const matchedVariant = barcode ? product.variants.find((v) => v.barcode === barcode) : null;
  const totalStock = product.inventory
    .filter((i) => !matchedVariant || i.variantId === matchedVariant.id)
    .reduce((s, i) => s + i.quantity, 0);

  return NextResponse.json({
    found: true,
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      sellingPrice: product.promoPrice ?? product.sellingPrice,
      imageUrl: product.images[0]?.url ?? null,
      variant: matchedVariant
        ? { id: matchedVariant.id, label: [matchedVariant.size, matchedVariant.color].filter(Boolean).join(" ") }
        : null,
      stock: totalStock,
      locations: product.inventory
        .filter((i) => !matchedVariant || i.variantId === matchedVariant.id)
        .map((i) => ({ code: i.location.code, warehouse: i.location.warehouse.name, quantity: i.quantity })),
    },
  });
}
