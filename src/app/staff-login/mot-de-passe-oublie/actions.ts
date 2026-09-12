"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createStaffResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/notifications/email";
import { getStoreBranding } from "@/lib/store-branding";

export type RequestResetState = { error?: string };

export async function requestStaffResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Merci de renseigner votre email." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.active) {
    const token = await createStaffResetToken(user.id);
    const branding = await getStoreBranding();
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/staff-login/reinitialiser?token=${token}`;
    await sendEmail(
      email,
      `Réinitialisation de mot de passe — ${branding.name}`,
      `<p>Bonjour ${user.name},</p><p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe (valable 30 minutes) :</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    );
  }

  // Toujours rediriger vers le même message, que le compte existe ou non,
  // pour ne pas révéler quels emails sont enregistrés.
  redirect("/staff-login/mot-de-passe-oublie?envoye=1");
}
