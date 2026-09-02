import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationItem } from "@/components/notification-item";
import { markCustomerNotificationReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function CustomerNotificationsPage() {
  const session = await requireCustomer();
  const notifications = await prisma.notification.findMany({
    where: { audience: "CUSTOMER", customerId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>
      <Card className="p-2">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" description="Vous serez informé de l'avancement de vos commandes ici." />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                id={n.id}
                title={n.title}
                body={n.body}
                type={n.type}
                read={n.read}
                createdAt={n.createdAt.toISOString()}
                onMarkRead={markCustomerNotificationReadAction}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
