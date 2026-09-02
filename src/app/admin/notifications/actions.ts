"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireStaff();
  await prisma.notification.updateMany({ where: { id: notificationId, userId: session.sub }, data: { read: true } });
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await requireStaff();
  await prisma.notification.updateMany({ where: { userId: session.sub, read: false }, data: { read: true } });
  revalidatePath("/admin/notifications");
}
