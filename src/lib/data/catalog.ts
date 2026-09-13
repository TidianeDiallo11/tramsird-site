import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getFavoriteProductIds } from "@/lib/data/favorites";

export async function withFavorites<T extends { id: string }>(products: T[]) {
  const favoriteIds = await getFavoriteProductIds();
  return products.map((p) => ({ ...p, favorited: favoriteIds.has(p.id) }));
}

export async function getStockByProductIds(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, number>();
  const rows = await prisma.inventory.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.productId, row._sum.quantity ?? 0);
  return map;
}

export async function getProductStock(productId: string, variantId?: string | null) {
  const agg = await prisma.inventory.aggregate({
    where: { productId, variantId: variantId ?? undefined },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sellingPrice: true,
  promoPrice: true,
  featured: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true } },
  images: { orderBy: { position: "asc" as const }, take: 2 },
};

export async function getFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { active: true, featured: true },
    select: productCardSelect,
    take: limit,
  });
  return attachStock(products);
}

export async function getNewProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    select: productCardSelect,
    take: limit,
  });
  return attachStock(products);
}

export async function getPromotedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { active: true, promoPrice: { not: null } },
    select: productCardSelect,
    take: limit,
  });
  return attachStock(products);
}

export async function getBestSellers(limit = 8) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const ids = grouped.map((g) => g.productId);
  if (ids.length === 0) return getFeaturedProducts(limit);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    select: productCardSelect,
  });
  const order = new Map(ids.map((id, i) => [id, i]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return attachStock(products);
}

export async function attachStock<T extends { id: string }>(products: T[]) {
  const stockMap = await getStockByProductIds(products.map((p) => p.id));
  return products.map((p) => ({ ...p, stock: stockMap.get(p.id) ?? 0 }));
}

export async function getCategoriesTree() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return categories;
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug }, include: { children: true, parent: true } });
}

export type CatalogFilters = {
  q?: string;
  categorySlug?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  promoOnly?: boolean;
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest";
  page?: number;
  perPage?: number;
};

export async function searchProducts(filters: CatalogFilters) {
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 24;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { description: { contains: filters.q, mode: "insensitive" as const } },
            { sku: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.categorySlug
      ? { category: { OR: [{ slug: filters.categorySlug }, { parent: { slug: filters.categorySlug } }] } }
      : {}),
    ...(filters.brand ? { brand: { name: filters.brand } } : {}),
    ...(filters.promoOnly ? { promoPrice: { not: null } } : {}),
    ...(filters.minPrice || filters.maxPrice
      ? {
          sellingPrice: {
            ...(filters.minPrice ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };

  const orderBy =
    filters.sort === "price_asc"
      ? { sellingPrice: "asc" as const }
      : filters.sort === "price_desc"
        ? { sellingPrice: "desc" as const }
        : filters.sort === "newest"
          ? { createdAt: "desc" as const }
          : { featured: "desc" as const };

  const [items, total, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  let withStock = await attachStock(items);
  if (filters.inStockOnly) withStock = withStock.filter((p) => p.stock > 0);

  return { items: withStock, total, page, perPage, brands, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

export const getProductBySlug = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { where: { active: true } },
      category: true,
      brand: true,
    },
  });
  if (!product) return null;

  const stockRows = await prisma.inventory.groupBy({
    by: ["variantId"],
    where: { productId: product.id },
    _sum: { quantity: true },
  });
  const stock = stockRows.reduce((sum, row) => sum + (row._sum.quantity ?? 0), 0);
  const variantStocks = new Map<string, number>();
  for (const row of stockRows) {
    if (row.variantId) variantStocks.set(row.variantId, row._sum.quantity ?? 0);
  }

  return { ...product, stock, variantStocks };
});

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
  const products = await prisma.product.findMany({
    where: { categoryId, active: true, id: { not: excludeId } },
    select: productCardSelect,
    take: limit,
  });
  return attachStock(products);
}
