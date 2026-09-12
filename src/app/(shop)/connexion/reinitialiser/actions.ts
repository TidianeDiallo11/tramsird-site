"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { consumePasswordResetToken } from "@/lib/password-reset";

export type ResetPasswordState = { error?: string };

export async function resetCustomerPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!code || password.length < 6) {
    return { error: "Vérifiez le code reçu par SMS et choisissez un mot de passe d'au moins 6 caractères." };
  }

  const customerId = await consumePasswordResetToken("CUSTOMER", code);
  if (!customerId) {
    return { error: "Ce code est invalide ou a expiré. Demandez-en un nouveau." };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { passwordHash: await hashPassword(password) },
  });

  redirect("/connexion?reinitialise=1");
}
