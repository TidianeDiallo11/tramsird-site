"use client";

import * as React from "react";
import { AlertTriangle, Bell, CheckCircle2, Info } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export function NotificationItem({
  id,
  title,
  body,
  type,
  read,
  createdAt,
  onMarkRead,
}: {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  onMarkRead: (id: string) => void | Promise<void>;
}) {
  const [isRead, setIsRead] = React.useState(read);
  const Icon = ICONS[type] ?? Bell;

  return (
    <button
      onClick={() => {
        if (!isRead) {
          setIsRead(true);
          onMarkRead(id);
        }
      }}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors",
        isRead ? "bg-transparent" : "bg-brand-soft/60",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          type === "warning" && "bg-warning-soft text-warning",
          type === "success" && "bg-success-soft text-success",
          type === "info" && "bg-info-soft text-info",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-sm text-muted-foreground">{body}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{relativeTime(createdAt)}</span>
      </span>
      {!isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />}
    </button>
  );
}
