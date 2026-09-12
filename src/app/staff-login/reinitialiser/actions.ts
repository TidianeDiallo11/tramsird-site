"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { consumePasswordResetToken } from "@/lib/password-reset";

export type ResetPasswordState = { error?: string };

export async function resetStaffPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!token || password.length < 6) {
    return { error: "Choisissez un mot de passe d'au moins 6 caractères." };
  }

  const userId = await consumePasswordResetToken("STAFF", token);
  if (!userId) {
    return { error: "Ce lien est invalide ou a expiré. Demandez-en un nouveau." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });

  redirect("/staff-login?reinitialise=1");
}
