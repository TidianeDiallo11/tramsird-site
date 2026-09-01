"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, logAudit } from "@/lib/auth";
import { createStaffSession } from "@/lib/session";

export type StaffLoginState = { error?: string };

export async function staffLoginAction(
  _prev: StaffLoginState,
  formData: FormData,
): Promise<StaffLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Merci de renseigner votre email et votre mot de passe." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return { error: "Identifiants incorrects ou compte désactivé." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Identifiants incorrects." };
  }

  await createStaffSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  await logAudit({
    userId: user.id,
    action: "staff.login",
    entityType: "User",
    entityId: user.id,
  });

  if (user.role === "CASHIER") {
    redirect("/pos");
  }
  redirect("/admin");
}
