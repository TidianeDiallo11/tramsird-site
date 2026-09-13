"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import { slugify, generateSku } from "@/lib/utils";
import { CATALOG_CACHE_TAG } from "@/lib/data/catalog";

export type ProductFormState = { error?: string; success?: boolean };

function parseImageUrls(raw: string) {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
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

  if (!name || !categoryId || !sellingPrice) {
    return { error: "Nom, catégorie et prix de vente sont obligatoires." };
  }

  if (id) {
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
        ...(imageUrls.length
          ? {
              images: {
                deleteMany: {},
                create: imageUrls.map((url, i) => ({ url, position: i })),
              },
            }
          : {}),
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
    await logAudit({ userId: session.sub, action: "product.create", entityType: "Product", entityId: created.id });
  }

  revalidatePath("/admin/produits");
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
