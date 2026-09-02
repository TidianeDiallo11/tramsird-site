import type { Metadata } from "next";
import { Tags, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryButton } from "./delete-button";

export const metadata: Metadata = { title: "Catégories" };

export default async function CategoriesPage() {
  const session = await requirePermission("products.view");
  const canEdit = hasPermission(session.role, "products.edit");
  const canDelete = hasPermission(session.role, "products.delete");

  const categories = await prisma.category.findMany({
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  const roots = categories.filter((c) => !c.parentId);
  const flat = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Catégories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} catégorie(s)</p>
        </div>
        {canEdit && <CategoryFormDialog categories={flat} />}
      </div>

      {roots.length === 0 ? (
        <EmptyState icon={Tags} title="Aucune catégorie" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((root) => (
            <Card key={root.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{root.name}</p>
                  <Badge variant="neutral" className="mt-1">{root._count.products} produit(s)</Badge>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <CategoryFormDialog
                      categories={flat}
                      values={{ id: root.id, name: root.name, parentId: root.parentId, imageUrl: root.imageUrl }}
                      trigger={<button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted cursor-pointer"><Pencil className="size-4" /></button>}
                    />
                    {canDelete && <DeleteCategoryButton categoryId={root.id} />}
                  </div>
                )}
              </div>
              {categories.filter((c) => c.parentId === root.id).length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {categories.filter((c) => c.parentId === root.id).map((child) => (
                    <li key={child.id} className="flex items-center justify-between text-sm">
                      <span>{child.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{child._count.products}</Badge>
                        {canEdit && (
                          <div className="flex">
                            <CategoryFormDialog
                              categories={flat}
                              values={{ id: child.id, name: child.name, parentId: child.parentId, imageUrl: child.imageUrl }}
                              trigger={<button className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted cursor-pointer"><Pencil className="size-3.5" /></button>}
                            />
                            {canDelete && <DeleteCategoryButton categoryId={child.id} />}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
