"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ADMIN_NAV } from "@/components/admin/nav-items";
import { Logo } from "@/components/shop/logo";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/permissions";

export function AdminSidebar({
  allowed,
  storeName,
  logoUrl,
}: {
  allowed: Set<Permission>;
  storeName?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const items = ADMIN_NAV.filter((item) => allowed.has(item.permission));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Logo name={storeName} logoUrl={logoUrl} />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 no-scrollbar">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-soft text-brand-strong"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.external && <ExternalLink className="size-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
