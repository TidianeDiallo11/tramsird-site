import "server-only";
import { prisma } from "@/lib/prisma";

export type PeriodKey = "today" | "7d" | "30d" | "year" | "custom";

export function resolvePeriod(key: PeriodKey, customFrom?: string, customTo?: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { from: startOfToday, to: now };
    case "7d":
      return { from: new Date(startOfToday.getTime() - 6 * 86400000), to: now };
    case "30d":
      return { from: new Date(startOfToday.getTime() - 29 * 86400000), to: now };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : startOfToday,
        to: customTo ? new Date(customTo) : now,
      };
  }
}

function previousPeriod(from: Date, to: Date) {
  const duration = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - duration), to: new Date(from.getTime()) };
}

const PAID_STATUSES = ["PAID", "PREPARING", "READY", "SHIPPED", "DELIVERED"] as const;

async function revenueFor(from: Date, to: Date) {
  const [orders, items] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] } },
      select: { id: true, total: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] } } },
      include: { product: { select: { costPrice: true } } },
    }),
  ]);

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const unitsSold = items.reduce((sum, i) => sum + i.quantity, 0);
  const profit = items.reduce((sum, i) => sum + (i.unitPrice - i.product.costPrice) * i.quantity, 0);

  return { revenue, orderCount: orders.length, unitsSold, profit };
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function getDashboardStats(from: Date, to: Date) {
  const prev = previousPeriod(from, to);
  const [current, previous] = await Promise.all([revenueFor(from, to), revenueFor(prev.from, prev.to)]);

  return {
    revenue: current.revenue,
    revenueTrend: pctChange(current.revenue, previous.revenue),
    orderCount: current.orderCount,
    orderCountTrend: pctChange(current.orderCount, previous.orderCount),
    unitsSold: current.unitsSold,
    unitsSoldTrend: pctChange(current.unitsSold, previous.unitsSold),
    profit: current.profit,
    profitTrend: pctChange(current.profit, previous.profit),
  };
}

export async function getRevenueSeries(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] } },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: "asc" },
  });

  const dayMs = 86400000;
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / dayMs));
  const buckets = new Map<string, number>();

  for (let i = 0; i <= days; i++) {
    const d = new Date(from.getTime() + i * dayMs);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }

  return Array.from(buckets.entries()).map(([date, total]) => ({
    date: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(date)),
    total,
  }));
}

export async function getTopProducts(from: Date, to: Date, limit = 6) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { createdAt: { gte: from, lte: to }, status: { in: [...PAID_STATUSES] } } },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const products = await prisma.product.findMany({ where: { id: { in: grouped.map((g) => g.productId) } } });
  return grouped.map((g) => {
    const product = products.find((p) => p.id === g.productId);
    return {
      id: g.productId,
      name: product?.name ?? "Produit supprimé",
      quantity: g._sum.quantity ?? 0,
      revenue: g._sum.subtotal ?? 0,
    };
  });
}

export async function getLowStockProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { inventory: true },
  });
  return products
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.inventory.reduce((sum, i) => sum + i.quantity, 0),
      threshold: p.lowStockThreshold,
    }))
    .filter((p) => p.stock <= p.threshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit);
}

export async function getRecentOrders(limit = 6) {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { customer: true },
  });
}

export async function getRecentPayments(limit = 6) {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { order: true },
  });
}
