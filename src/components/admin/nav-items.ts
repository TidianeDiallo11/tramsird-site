import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  Boxes,
  Warehouse,
  Tags,
  ClipboardList,
  Users,
  Truck,
  CreditCard,
  Bike,
  Percent,
  Star,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  external?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "reports.view" },
  { href: "/admin/ventes", label: "Ventes", icon: TrendingUp, permission: "reports.view" },
  { href: "/pos", label: "Caisse / POS", icon: ShoppingCart, permission: "pos.sell", external: true },
  { href: "/admin/produits", label: "Produits", icon: Package, permission: "products.view" },
  { href: "/admin/categories", label: "Catégories", icon: Tags, permission: "products.view" },
  { href: "/admin/stock", label: "Stock", icon: Boxes, permission: "stock.view" },
  { href: "/admin/rangement", label: "Rangement", icon: Warehouse, permission: "stock.view" },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList, permission: "orders.view" },
  { href: "/admin/clients", label: "Clients", icon: Users, permission: "customers.view" },
  { href: "/admin/fournisseurs", label: "Fournisseurs", icon: Truck, permission: "suppliers.view" },
  { href: "/admin/paiements", label: "Paiements", icon: CreditCard, permission: "payments.view" },
  { href: "/admin/livraisons", label: "Livraisons", icon: Bike, permission: "orders.view" },
  { href: "/admin/promotions", label: "Promotions", icon: Percent, permission: "promotions.manage" },
  { href: "/admin/fidelite", label: "Fidélité", icon: Star, permission: "loyalty.manage" },
  { href: "/admin/rapports", label: "Rapports", icon: BarChart3, permission: "reports.view" },
  { href: "/admin/employes", label: "Employés", icon: UserCog, permission: "employees.view" },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings, permission: "settings.manage" },
];
