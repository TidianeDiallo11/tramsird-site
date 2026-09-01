import { Heart } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { attachStock } from "@/lib/data/catalog";

export const metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const session = await requireCustomer();
  const favorites = await prisma.favorite.findMany({
    where: { customerId: session.sub },
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true, brand: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const withStock = await attachStock(favorites.map((f) => f.product));
  const products = withStock.map((p) => ({ ...p, favorited: true }));

  if (products.length === 0) {
    return (
      <EmptyState icon={Heart} title="Aucun favori" description="Ajoutez des produits à vos favoris pour les retrouver ici." />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
