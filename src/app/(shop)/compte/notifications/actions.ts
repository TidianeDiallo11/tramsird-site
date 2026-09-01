"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";

export async function markCustomerNotificationReadAction(notificationId: string) {
  const session = await requireCustomer();
  await prisma.notification.updateMany({ where: { id: notificationId, customerId: session.sub }, data: { read: true } });
  revalidatePath("/compte/notifications");
}
