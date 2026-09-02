import "server-only";
import { prisma } from "@/lib/prisma";

export async function notifyStaff(title: string, body: string, type: "info" | "success" | "warning" = "info") {
  const staff = await prisma.user.findMany({ where: { active: true, role: { in: ["ADMIN", "MANAGER"] } } });
  if (staff.length === 0) return;
  await prisma.notification.createMany({
    data: staff.map((u) => ({ audience: "STAFF" as const, userId: u.id, title, body, type })),
  });
}

export async function notifyCustomer(customerId: string, title: string, body: string, type: "info" | "success" | "warning" = "info") {
  await prisma.notification.create({ data: { audience: "CUSTOMER", customerId, title, body, type } });
}
