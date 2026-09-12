"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createCustomerSession, clearCustomerSession } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";

export type AuthState = { error?: string };

export async function registerCustomerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !phone || password.length < 6) {
    return { error: "Vérifiez votre nom, votre téléphone et un mot de passe d'au moins 6 caractères." };
  }

  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) {
    return { error: "Un compte existe déjà avec ce numéro de téléphone." };
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      email: email || null,
      passwordHash: await hashPassword(password),
    },
  });

  await createCustomerSession({ sub: customer.id, name: customer.name, phone: customer.phone });
  redirect("/compte");
}

export async function loginCustomerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Merci de renseigner votre téléphone ou email, et votre mot de passe." };
  }

  const isEmail = identifier.includes("@");
  const customer = await prisma.customer.findFirst({
    where: isEmail ? { email: identifier.toLowerCase() } : { phone: normalizePhone(identifier) },
  });
  if (!customer || !customer.passwordHash) {
    return { error: "Aucun compte trouvé avec ces identifiants." };
  }

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) {
    return { error: "Mot de passe incorrect." };
  }

  await createCustomerSession({ sub: customer.id, name: customer.name, phone: customer.phone });
  redirect("/compte");
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}
