"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, logAudit } from "@/lib/auth";
import { createCustomerSession, createStaffSession, clearCustomerSession } from "@/lib/session";
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

  if (customer?.passwordHash) {
    if (!(await verifyPassword(password, customer.passwordHash))) {
      return { error: "Mot de passe incorrect." };
    }
    await createCustomerSession({ sub: customer.id, name: customer.name, phone: customer.phone });
    redirect("/compte");
  }

  // Pas de compte client avec cet identifiant : on essaie le compte gérant/équipe,
  // pour permettre de se connecter au même endroit avec les mêmes identifiants.
  if (isEmail) {
    const staff = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
    if (staff?.active && (await verifyPassword(password, staff.passwordHash))) {
      await createStaffSession({ sub: staff.id, role: staff.role, name: staff.name, email: staff.email });
      await logAudit({ userId: staff.id, action: "staff.login", entityType: "User", entityId: staff.id });
      redirect(staff.role === "CASHIER" ? "/pos" : "/admin");
    }
  }

  return { error: "Aucun compte trouvé avec ces identifiants." };
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}
