"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV } from "@/components/admin/nav-items";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

export function AdminMobileNav({ allowed }: { allowed: Set<Permission> }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) => allowed.has(item.permission));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="lg:hidden">
        <Menu className="size-5" />
      </Button>
      <DialogContent className="max-w-xs p-0 sm:top-0 sm:left-0 sm:h-full sm:max-h-full sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:rounded-r-2xl">
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <nav className="space-y-0.5 p-3">
          {items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  active ? "bg-brand-soft text-brand-strong" : "text-muted-foreground hover:bg-surface-muted",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
