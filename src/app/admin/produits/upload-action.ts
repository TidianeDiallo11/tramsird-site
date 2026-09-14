"use server";

import { put } from "@vercel/blob";
import { getStaffSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const session = await getStaffSession();
  if (!session || !(hasPermission(session.role, "products.create") || hasPermission(session.role, "products.edit"))) {
    return { error: "Non autorisé." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Fichier invalide." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit être une image (JPG, PNG, WebP…)." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "Image trop lourde (5 Mo maximum)." };
  }

  try {
    const blob = await put(`produits/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch {
    return {
      error:
        "Le stockage des images (Vercel Blob) n'est pas configuré sur ce projet. Voir les paramètres du projet sur vercel.com.",
    };
  }
}
