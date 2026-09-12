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
    await sendSms(
      customer.phone,
      `${code} est votre code de réinitialisation ${process.env.NEXT_PUBLIC_APP_NAME ?? "NL TRADING"}. Valable 30 minutes.`,
    );
  }

  // Toujours rediriger vers le même message, que le compte existe ou non,
  // pour ne pas révéler quels comptes sont enregistrés.
  redirect("/connexion/reinitialiser?envoye=1");
}
