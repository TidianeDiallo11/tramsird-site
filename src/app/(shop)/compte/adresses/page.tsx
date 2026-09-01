import { MapPin, Star, Trash2 } from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { addAddressAction, deleteAddressAction, setDefaultAddressAction } from "./actions";

export const metadata = { title: "Mes adresses" };

export default async function AddressesPage() {
  const session = await requireCustomer();
  const addresses = await prisma.address.findMany({
    where: { customerId: session.sub },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <EmptyState icon={MapPin} title="Aucune adresse enregistrée" />
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {addr.label}
                  {addr.isDefault && <Star className="size-3.5 fill-accent text-accent" />}
                </p>
                <p className="text-sm text-muted-foreground">{addr.fullAddress}, {addr.city}</p>
                {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {!addr.isDefault && (
                  <form action={setDefaultAddressAction.bind(null, addr.id)}>
                    <Button type="submit" size="sm" variant="outline">Par défaut</Button>
                  </form>
                )}
                <form action={deleteAddressAction.bind(null, addr.id)}>
                  <Button type="submit" size="icon" variant="ghost" aria-label="Supprimer">
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </form>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="h-fit space-y-3 p-5">
        <h2 className="font-semibold">Ajouter une adresse</h2>
        <form action={addAddressAction} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="label">Libellé</Label>
            <Input id="label" name="label" placeholder="Domicile, Bureau…" defaultValue="Domicile" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullAddress">Adresse</Label>
            <Input id="fullAddress" name="fullAddress" required placeholder="Quartier, rue, repère" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" name="city" required placeholder="Conakry" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" placeholder={session?.phone} />
          </div>
          <Button type="submit" className="w-full">Enregistrer</Button>
        </form>
      </Card>
    </div>
  );
}
