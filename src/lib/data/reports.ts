import "server-only";
import { prisma } from "@/lib/prisma";

const PAID_STATUSES = ["PAID", "PREPARING", "READY", "SHIPPED", "DELIVERED"] as const;

export async function getLeastSoldProducts(from: Date, to: Date, limit = 6) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "asc" } },
    take: limit,
  });
  const products = await prisma.product.findMany({ where: { id: { in: grouped.map((g) => g.productId) } } });
  return grouped.map((g) => ({
    id: g.productId,
    name: products.find((p) => p.id === g.productId)?.name ?? "Produit",
    quantity: g._sum.quantity ?? 0,
  }));
}

export async function getEmployeePerformance(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] }, employeeId: { not: null } },
    include: { employee: true },
  });
  const map = new Map<string, { name: string; sales: number; revenue: number }>();
  for (const o of orders) {
    if (!o.employee) continue;
    const entry = map.get(o.employee.id) ?? { name: o.employee.name, sales: 0, revenue: 0 };
    entry.sales += 1;
    entry.revenue += o.total;
    map.set(o.employee.id, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export async function getPaymentBreakdown(from: Date, to: Date) {
  const grouped = await prisma.payment.groupBy({
    by: ["method"],
    where: { status: "SUCCEEDED", createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
    _count: true,
  });
  return grouped
    .map((g) => ({ method: g.method, amount: g._sum.amount ?? 0, count: g._count }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getCustomerInsights(from: Date, to: Date) {
  const [newCustomers, totalCustomers, topSpenders] = await Promise.all([
    prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.customer.count(),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] }, customerId: { not: null } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ]);

  const customers = await prisma.customer.findMany({
    where: { id: { in: topSpenders.map((t) => t.customerId!).filter(Boolean) } },
  });

  return {
    newCustomers,
    totalCustomers,
    topSpenders: topSpenders.map((t) => ({
      name: customers.find((c) => c.id === t.customerId)?.name ?? "Client",
      total: t._sum.total ?? 0,
    })),
  };
}

export async function getStockValuation() {
  const products = await prisma.product.findMany({ include: { inventory: true } });
  let totalUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  for (const p of products) {
    const qty = p.inventory.reduce((s, i) => s + i.quantity, 0);
    totalUnits += qty;
    totalCostValue += qty * p.costPrice;
    totalRetailValue += qty * (p.promoPrice ?? p.sellingPrice);
  }
  return { totalUnits, totalCostValue, totalRetailValue };
}
