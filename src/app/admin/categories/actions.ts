"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, logAudit } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type CategoryFormState = { error?: string; success?: boolean };

export async function saveCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const session = await requirePermission("products.edit");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!name) return { error: "Le nom est obligatoire." };
  if (parentId === id) return { error: "Une catégorie ne peut pas être son propre parent." };

  if (id) {
    await prisma.category.update({ where: { id }, data: { name, parentId, imageUrl } });
    await logAudit({ userId: session.sub, action: "category.update", entityType: "Category", entityId: id });
  } else {
    const created = await prisma.category.create({
      data: { name, slug: `${slugify(name)}-${Date.now().toString(36)}`, parentId, imageUrl },
    });
    await logAudit({ userId: session.sub, action: "category.create", entityType: "Category", entityId: created.id });
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await requirePermission("products.delete");
  const count = await prisma.product.count({ where: { categoryId } });
  if (count > 0) {
    return { error: `Impossible : ${count} produit(s) utilisent encore cette catégorie.` };
  }
  await prisma.category.delete({ where: { id: categoryId } });
  await logAudit({ userId: session.sub, action: "category.delete", entityType: "Category", entityId: categoryId });
  revalidatePath("/admin/categories");
  return { success: true };
}
