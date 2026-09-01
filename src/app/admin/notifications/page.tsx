import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationItem } from "@/components/notification-item";
import { markAllNotificationsReadAction, markNotificationReadAction } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getStaffSession();
  const notifications = await prisma.notification.findMany({
    where: { audience: "STAFF", userId: session!.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{notifications.filter((n) => !n.read).length} non lue(s)</p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <Button type="submit" variant="outline" size="sm">Tout marquer comme lu</Button>
        </form>
      </div>

      <Card className="p-2">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Aucune notification" />
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
                onMarkRead={markNotificationReadAction}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
