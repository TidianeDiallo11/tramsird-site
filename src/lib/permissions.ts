import type { StaffRole } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "pos.sell",
  "pos.discount",
  "products.view",
  "products.create",
  "products.edit",
  "products.edit_price",
  "products.delete",
  "stock.view",
  "stock.adjust",
  "warehouse.manage",
  "orders.view",
  "orders.manage",
  "customers.view",
  "customers.manage",
  "suppliers.view",
  "suppliers.manage",
  "payments.view",
  "payments.manage_settings",
  "delivery.manage",
  "delivery.update_status",
  "promotions.manage",
  "loyalty.manage",
  "reports.view",
  "reports.view_profit",
  "employees.view",
  "employees.manage",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  MANAGER: [
    "pos.sell",
    "pos.discount",
    "products.view",
    "products.create",
    "products.edit",
    "products.edit_price",
    "products.delete",
    "stock.view",
    "stock.adjust",
    "warehouse.manage",
    "orders.view",
    "orders.manage",
    "customers.view",
    "customers.manage",
    "suppliers.view",
    "suppliers.manage",
    "payments.view",
    "delivery.manage",
    "delivery.update_status",
    "promotions.manage",
    "loyalty.manage",
    "reports.view",
    "reports.view_profit",
    "employees.view",
  ],
  CASHIER: [
    "pos.sell",
    "products.view",
    "stock.view",
    "orders.view",
    "customers.view",
    "customers.manage",
    "reports.view",
  ],
  STOCK: [
    "products.view",
    "products.edit",
    "stock.view",
    "stock.adjust",
    "warehouse.manage",
    "suppliers.view",
    "suppliers.manage",
    "orders.view",
    "reports.view",
  ],
  DELIVERY: [
    "orders.view",
    "delivery.update_status",
    "reports.view",
  ],
};

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  CASHIER: "Caissier",
  STOCK: "Agent de stock",
  DELIVERY: "Livreur",
};
