import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { logoutCustomerAction } from "./actions";

const TABS = [
  { href: "/compte", label: "Aperçu" },
  { href: "/compte/commandes", label: "Commandes" },
  { href: "/compte/favoris", label: "Favoris" },
  { href: "/compte/adresses", label: "Adresses" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCustomer();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Bonjour, {session.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{session.phone}</p>
        </div>
        <form action={logoutCustomerAction}>
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </form>
      </div>

      <div className="relative mb-6">
        <nav className="flex gap-1 overflow-x-auto rounded-full bg-surface-muted p-1 no-scrollbar">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {/* Indique que la barre d'onglets se poursuit hors de l'écran (mobile étroit) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-full bg-gradient-to-l from-surface-muted to-transparent" />
      </div>

      {children}
    </div>
  );
}
