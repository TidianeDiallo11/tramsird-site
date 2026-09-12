"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { createCustomerResetCode } from "@/lib/password-reset";
import { sendSms } from "@/lib/notifications/sms";

export type RequestResetState = { error?: string };

export async function requestCustomerResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!phone) {
    return { error: "Merci de renseigner votre numéro de téléphone." };
  }

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (customer) {
    const code = await createCustomerResetCode(customer.id);
    await sendSms(
      phone,
      `${code} est votre code de réinitialisation ${process.env.NEXT_PUBLIC_APP_NAME ?? "NL TRADING"}. Valable 30 minutes.`,
    );
  }

  // Toujours rediriger vers le même message, que le compte existe ou non,
  // pour ne pas révéler quels numéros sont enregistrés.
  redirect("/connexion/reinitialiser?envoye=1");
}
