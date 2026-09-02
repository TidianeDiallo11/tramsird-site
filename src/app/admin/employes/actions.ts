"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, hashPassword, logAudit } from "@/lib/auth";
import type { StaffRole } from "@/generated/prisma/enums";

export type EmployeeFormState = { error?: string; success?: boolean };

export async function createEmployeeAction(
  _prev: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  const session = await requirePermission("employees.manage");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "CASHIER") as StaffRole;
  const position = String(formData.get("position") ?? "").trim() || role;

  if (!name || !email || password.length < 6) {
    return { error: "Nom, email et mot de passe (6 caractères min.) sont obligatoires." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet email." };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role,
      passwordHash: await hashPassword(password),
      employee: { create: { position } },
    },
  });

  await logAudit({ userId: session.sub, action: "employee.create", entityType: "User", entityId: user.id, metadata: { role } });
  revalidatePath("/admin/employes");
  return { success: true };
}

export async function updateEmployeeRoleAction(userId: string, role: StaffRole) {
  const session = await requirePermission("employees.manage");
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAudit({ userId: session.sub, action: "employee.role_update", entityType: "User", entityId: userId, metadata: { role } });
  revalidatePath("/admin/employes");
}

export async function toggleEmployeeActiveAction(userId: string) {
  const session = await requirePermission("employees.manage");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  await logAudit({ userId: session.sub, action: user.active ? "employee.deactivate" : "employee.activate", entityType: "User", entityId: userId });
  revalidatePath("/admin/employes");
}
