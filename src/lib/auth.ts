import "server-only";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getStaffSession, getCustomerSession, type StaffSessionPayload } from "@/lib/session";
import { hasPermission, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function requireStaff(): Promise<StaffSessionPayload> {
  const session = await getStaffSession();
  if (!session) redirect("/staff-login");
  return session;
}

export async function requirePermission(permission: Permission): Promise<StaffSessionPayload> {
  const session = await requireStaff();
  if (!hasPermission(session.role, permission)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) redirect("/compte/connexion");
  return session;
}

export async function currentStaffUser() {
  const session = await getStaffSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.sub } });
}

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: params.metadata as never,
    },
  });
}
