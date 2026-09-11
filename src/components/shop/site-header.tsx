"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, User, Heart, Bell } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shop/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({
  customerName,
  unreadNotifications = 0,
  storeName,
  logoUrl,
}: {
  customerName: string | null;
  unreadNotifications?: number;
  storeName?: string;
  logoUrl?: string | null;
}) {
  const { count } = useCart();
  const router = useRouter();

  function onSearch(formData: FormData) {
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/catalogue?q=${encodeURIComponent(q)}` : "/catalogue");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo name={storeName} logoUrl={logoUrl} />
        </Link>

        <form
          action={onSearch}
          className="relative hidden flex-1 max-w-xl md:block"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Rechercher un produit, une marque…"
            className="h-10 pl-10"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <Link href="/catalogue">
            <Button variant="ghost" size="sm">Catalogue</Button>
          </Link>
          <Link href="/catalogue?promo=1">
            <Button variant="ghost" size="sm">Promotions</Button>
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <ThemeToggle />
          {customerName && (
            <Link href="/compte/notifications" className="relative hidden sm:block">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-5" />
              </Button>
              {unreadNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>
          )}
          <Link href="/compte/favoris" className="hidden sm:block">
            <Button variant="ghost" size="icon" aria-label="Favoris">
              <Heart className="size-5" />
            </Button>
          </Link>
          <Link href="/panier" className="relative">
            <Button variant="ghost" size="icon" aria-label="Panier">
              <ShoppingBag className="size-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
          <Link href={customerName ? "/compte" : "/connexion"} className="hidden sm:block">
            <Button variant="outline" size="sm" className="gap-1.5">
              <User className="size-4" />
              {customerName ? customerName.split(" ")[0] : "Compte"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 md:hidden">
        <form action={onSearch} className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Rechercher…" className="h-10 pl-10" />
        </form>
      </div>
    </header>
  );
}
