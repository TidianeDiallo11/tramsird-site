"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { slugify, generateSku } from "@/lib/utils";
import { CATALOG_CACHE_TAG } from "@/lib/data/catalog";
import { upsertInventory } from "@/app/admin/stock/actions";

export type ProductFormState = { error?: string; success?: boolean };

function parseImageUrls(raw: string) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

// Choisit l'emplacement où appliquer l'ajustement rapide de stock depuis la
// fiche produit : celui où le produit a déjà le plus de stock, sinon un
// emplacement de l'entrepôt par défaut.
async function resolveQuickAdjustLocationId(productId: string): Promise<string | null> {
  const existing = await prisma.inventory.findFirst({
    where: { productId, variantId: null },
    orderBy: { quantity: "desc" },
    select: { locationId: true },
  });
  if (existing) return existing.locationId;

  const defaultLocation = await prisma.storageLocation.findFirst({
    where: { warehouse: { isDefault: true } },
    orderBy: { code: "asc" },
    select: { id: true },
  });
  if (defaultLocation) return defaultLocation.id;

  const anyLocation = await prisma.storageLocation.findFirst({ orderBy: { code: "asc" }, select: { id: true } });
  return anyLocation?.id ?? null;
}

async function applyQuickStockAdjustment(productId: string, targetStock: number, userId: string) {
  const inventoryRows = await prisma.inventory.findMany({ where: { productId, variantId: null } });
  const currentTotal = inventoryRows.reduce((sum, r) => sum + r.quantity, 0);
  const delta = targetStock - currentTotal;
  if (delta === 0) return;

  const locationId = await resolveQuickAdjustLocationId(productId);
  if (!locationId) return;

  await upsertInventory(productId, null, locationId, delta);
  await prisma.inventoryMovement.create({
    data: {
      productId,
      locationId,
      type: "ADJUSTMENT",
      quantity: targetStock,
      reason: "Ajustement depuis la fiche produit",
      userId,
    },
  });
}

export async function saveProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const session = await requirePermission(id ? "products.edit" : "products.create");

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const brandId = String(formData.get("brandId") ?? "") || null;
  const supplierId = String(formData.get("supplierId") ?? "") || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const costPrice = Number(formData.get("costPrice") ?? 0);
  const sellingPrice = Number(formData.get("sellingPrice") ?? 0);
  const promoPriceRaw = formData.get("promoPrice");
  const promoPrice = promoPriceRaw ? Number(promoPriceRaw) : null;
  const lowStockThreshold = Number(formData.get("lowStockThreshold") ?? 5);
  const featured = formData.get("featured") === "on";
  const imageUrls = parseImageUrls(String(formData.get("imageUrls") ?? ""));
  const stockRaw = formData.get("stock");
  const targetStock =
    stockRaw !== null && stockRaw !== "" && !Number.isNaN(Number(stockRaw))
      ? Math.max(0, Math.round(Number(stockRaw)))
      : null;

  if (!name || !categoryId || !sellingPrice) {
    return { error: "Nom, catégorie et prix de vente sont obligatoires." };
  }

  let productId: string;

  if (id) {
    productId = id;
    const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
    await prisma.product.update({
      where: { id },
      data: {
        name,
        categoryId,
        brandId,
        supplierId,
        description,
        costPrice,
        sellingPrice,
        promoPrice,
        lowStockThreshold,
        featured,
        images: {
          deleteMany: {},
          create: imageUrls.map((url, i) => ({ url, position: i })),
        },
      },
    });
    await logAudit({
      userId: session.sub,
      action: "product.update",
      entityType: "Product",
      entityId: id,
      metadata: { before: { sellingPrice: existing.sellingPrice }, after: { sellingPrice } },
    });
  } else {
    const slugBase = slugify(name);
    const sku = generateSku();
    const created = await prisma.product.create({
      data: {
        name,
        slug: `${slugBase}-${sku.toLowerCase()}`,
        categoryId,
        brandId,
        supplierId,
        description,
        costPrice,
        sellingPrice,
        promoPrice,
        sku,
        lowStockThreshold,
        featured,
        images: { create: imageUrls.map((url, i) => ({ url, position: i })) },
      },
    });
    productId = created.id;
    await logAudit({ userId: session.sub, action: "product.create", entityType: "Product", entityId: created.id });
  }

  if (targetStock !== null && hasPermission(session.role, "stock.adjust")) {
    await applyQuickStockAdjustment(productId, targetStock, session.sub);
  }

  revalidatePath("/admin/produits");
  revalidatePath("/admin/stock");
  revalidatePath("/admin/rangement");
  updateTag(CATALOG_CACHE_TAG);
  return { success: true };
}

export async function toggleProductActiveAction(productId: string) {
  const session = await requirePermission("products.edit");
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await prisma.product.update({ where: { id: productId }, data: { active: !product.active } });
  await logAudit({
    userId: session.sub,
    action: product.active ? "product.deactivate" : "product.activate",
    entityType: "Product",
    entityId: productId,
  });
  revalidatePath("/admin/produits");
  updateTag(CATALOG_CACHE_TAG);
}

export async function deleteProductAction(productId: string) {
  const session = await requirePermission("products.delete");
  await prisma.product.delete({ where: { id: productId } });
  await logAudit({ userId: session.sub, action: "product.delete", entityType: "Product", entityId: productId });
  revalidatePath("/admin/produits");
  updateTag(CATALOG_CACHE_TAG);
}
