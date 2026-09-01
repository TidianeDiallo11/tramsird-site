"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/catalogue", label: "Catalogue", icon: LayoutGrid },
  { href: "/catalogue?focus=search", label: "Recherche", icon: Search },
  { href: "/panier", label: "Panier", icon: ShoppingBag },
  { href: "/compte", label: "Compte", icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href.split("?")[0]);
          const Icon = tab.icon;
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-brand" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label === "Panier" && count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
