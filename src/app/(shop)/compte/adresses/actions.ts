"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/session";

export async function addAddressAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) return;

  const label = String(formData.get("label") ?? "Domicile");
  const fullAddress = String(formData.get("fullAddress") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || session.phone;
  if (!fullAddress || !city) return;

  const count = await prisma.address.count({ where: { customerId: session.sub } });
  await prisma.address.create({
    data: { customerId: session.sub, label, fullAddress, city, phone, isDefault: count === 0 },
  });
  revalidatePath("/compte/adresses");
}

export async function deleteAddressAction(addressId: string) {
  const session = await getCustomerSession();
  if (!session) return;
  await prisma.address.deleteMany({ where: { id: addressId, customerId: session.sub } });
  revalidatePath("/compte/adresses");
}

export async function setDefaultAddressAction(addressId: string) {
  const session = await getCustomerSession();
  if (!session) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { customerId: session.sub }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id: addressId, customerId: session.sub }, data: { isDefault: true } }),
  ]);
  revalidatePath("/compte/adresses");
}
