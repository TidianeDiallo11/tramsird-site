import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getFavoriteProductIds } from "@/lib/data/favorites";

// Le stock (Inventory) n'est JAMAIS mis en cache ci-dessous : il change à
// chaque vente et doit toujours refléter la réalité pour éviter de survendre.
// Seule la partie qui change rarement (existence/prix/catégorie des produits,
// catégories) est mise en cache, invalidée par revalidateCatalogCache() dans
// les actions admin produits/catégories (voir src/app/admin/produits/actions.ts
// et src/app/admin/categories/actions.ts).
export const CATALOG_CACHE_TAG = "catalog";
const CATALOG_CACHE_OPTIONS = { tags: [CATALOG_CACHE_TAG], revalidate: 300 };

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

const getFeaturedProductsCore = unstable_cache(
  (limit: number) =>
    prisma.product.findMany({
      where: { active: true, featured: true },
      select: productCardSelect,
      take: limit,
    }),
  ["catalog-featured"],
  CATALOG_CACHE_OPTIONS,
);
export async function getFeaturedProducts(limit = 8) {
  return attachStock(await getFeaturedProductsCore(limit));
}

const getNewProductsCore = unstable_cache(
  (limit: number) =>
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      select: productCardSelect,
      take: limit,
    }),
  ["catalog-new"],
  CATALOG_CACHE_OPTIONS,
);
export async function getNewProducts(limit = 8) {
  return attachStock(await getNewProductsCore(limit));
}

const getPromotedProductsCore = unstable_cache(
  (limit: number) =>
    prisma.product.findMany({
      where: { active: true, promoPrice: { not: null } },
      select: productCardSelect,
      take: limit,
    }),
  ["catalog-promoted"],
  CATALOG_CACHE_OPTIONS,
);
export async function getPromotedProducts(limit = 8) {
  return attachStock(await getPromotedProductsCore(limit));
}

const getBestSellersCore = unstable_cache(
  async (limit: number) => {
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });
    const ids = grouped.map((g) => g.productId);
    if (ids.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      select: productCardSelect,
    });
    const order = new Map(ids.map((id, i) => [id, i]));
    products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return products;
  },
  ["catalog-bestsellers"],
  CATALOG_CACHE_OPTIONS,
);
export async function getBestSellers(limit = 8) {
  const products = await getBestSellersCore(limit);
  if (products.length === 0) return getFeaturedProducts(limit);
  return attachStock(products);
}

export async function attachStock<T extends { id: string }>(products: T[]) {
  const stockMap = await getStockByProductIds(products.map((p) => p.id));
  return products.map((p) => ({ ...p, stock: stockMap.get(p.id) ?? 0 }));
}

export const getCategoriesTree = unstable_cache(
  () =>
    prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ["catalog-categories-tree"],
  CATALOG_CACHE_OPTIONS,
);

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

const searchProductsCore = unstable_cache(
  async (where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput, skip: number, take: number) => {
    const [items, total, brands] = await Promise.all([
      prisma.product.findMany({ where, select: productCardSelect, orderBy, skip, take }),
      prisma.product.count({ where }),
      prisma.brand.findMany({ orderBy: { name: "asc" } }),
    ]);
    return { items, total, brands };
  },
  ["catalog-search"],
  CATALOG_CACHE_OPTIONS,
);

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

  const { items, total, brands } = await searchProductsCore(where, orderBy, (page - 1) * perPage, perPage);

  let withStock = await attachStock(items);
  if (filters.inStockOnly) withStock = withStock.filter((p) => p.stock > 0);

  return { items: withStock, total, page, perPage, brands, pageCount: Math.max(1, Math.ceil(total / perPage)) };
}

const getProductCoreBySlug = unstable_cache(
  (slug: string) =>
    prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { where: { active: true } },
        category: true,
        brand: true,
      },
    }),
  ["catalog-product-by-slug"],
  CATALOG_CACHE_OPTIONS,
);

export const getProductBySlug = cache(async (slug: string) => {
  const product = await getProductCoreBySlug(slug);
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

const getRelatedProductsCore = unstable_cache(
  (categoryId: string, excludeId: string, limit: number) =>
    prisma.product.findMany({
      where: { categoryId, active: true, id: { not: excludeId } },
      select: productCardSelect,
      take: limit,
    }),
  ["catalog-related"],
  CATALOG_CACHE_OPTIONS,
);
export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
  return attachStock(await getRelatedProductsCore(categoryId, excludeId, limit));
}
