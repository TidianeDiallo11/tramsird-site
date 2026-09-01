import { Bell, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/permissions";
import type { StaffRole } from "@/generated/prisma/enums";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import type { Permission } from "@/lib/permissions";
import { staffLogoutAction } from "@/app/admin/actions";

export async function AdminTopbar({
  name,
  role,
  userId,
  allowed,
}: {
  name: string;
  role: StaffRole;
  userId: string;
  allowed: Set<Permission>;
}) {
  const unreadCount = await prisma.notification.count({
    where: { audience: "STAFF", userId, read: false },
  });

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <AdminMobileNav allowed={allowed} />
      <div className="flex-1" />
      <ThemeToggle />
      <a href="/admin/notifications" className="relative">
        <Button variant="ghost" size="icon">
          <Bell className="size-5" />
        </Button>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </a>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-surface-muted cursor-pointer">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left text-sm leading-tight sm:block">
              <span className="block font-medium">{name}</span>
              <span className="block text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{ROLE_LABELS[role]}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <form action={staffLogoutAction}>
            <DropdownMenuItem destructive asChild>
              <button type="submit" className="w-full">
                <LogOut className="size-4" /> Se déconnecter
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
