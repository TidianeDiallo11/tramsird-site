"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { createCustomerResetCode } from "@/lib/password-reset";
import { sendSms } from "@/lib/notifications/sms";
import { sendEmail } from "@/lib/notifications/email";
import { getStoreBranding } from "@/lib/store-branding";

export type RequestResetState = { error?: string };

export async function requestCustomerResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const identifier = String(formData.get("identifier") ?? "").trim();

  if (!identifier) {
    return { error: "Merci de renseigner votre téléphone ou email." };
  }

  const isEmail = identifier.includes("@");
  const customer = await prisma.customer.findFirst({
    where: isEmail ? { email: identifier.toLowerCase() } : { phone: normalizePhone(identifier) },
  });

  if (customer) {
    const code = await createCustomerResetCode(customer.id);
    const branding = await getStoreBranding();

    await sendSms(
      customer.phone,
      `${code} est votre code de réinitialisation ${branding.name}. Valable 30 minutes.`,
    );

    if (customer.email) {
      await sendEmail(
        customer.email,
        `Votre code de réinitialisation — ${branding.name}`,
        `<p>Bonjour ${customer.name},</p><p>Voici votre code de réinitialisation de mot de passe (valable 30 minutes) :</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${code}</p>`,
      );
    }
  }

  // Toujours rediriger vers le même message, que le compte existe ou non,
  // pour ne pas révéler quels comptes sont enregistrés.
  redirect("/connexion/reinitialiser?envoye=1");
}
