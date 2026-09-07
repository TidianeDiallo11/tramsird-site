// Efface les données de démo "métier" (catalogue, clients, commandes, stock,
// fournisseurs, promotions, livraisons...) tout en préservant les comptes
// staff, les rôles/permissions et les paramètres du magasin — pour repartir
// d'une base propre avant d'y entrer de vraies données.
import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Ordre respectant les contraintes de clé étrangère. Volontairement absents :
// employee, rolePermission, permission, user, loyaltyRule, storeSettings.
const deletes = [
  () => prisma.notification.deleteMany(),
  () => prisma.loyaltyTransaction.deleteMany(),
  () => prisma.auditLog.deleteMany(),
  () => prisma.paymentWebhookEvent.deleteMany(),
  () => prisma.paymentTransaction.deleteMany(),
  () => prisma.payment.deleteMany(),
  () => prisma.shipment.deleteMany(),
  () => prisma.orderStatusHistory.deleteMany(),
  () => prisma.orderItem.deleteMany(),
  () => prisma.order.deleteMany(),
  () => prisma.heldSale.deleteMany(),
  () => prisma.posSession.deleteMany(),
  () => prisma.favorite.deleteMany(),
  () => prisma.address.deleteMany(),
  () => prisma.customer.deleteMany(),
  () => prisma.coupon.deleteMany(),
  () => prisma.promotion.deleteMany(),
  () => prisma.purchaseOrderItem.deleteMany(),
  () => prisma.purchaseOrder.deleteMany(),
  () => prisma.inventoryMovement.deleteMany(),
  () => prisma.inventory.deleteMany(),
  () => prisma.storageLocation.deleteMany(),
  () => prisma.warehouse.deleteMany(),
  () => prisma.productVariant.deleteMany(),
  () => prisma.productImage.deleteMany(),
  () => prisma.product.deleteMany(),
  () => prisma.brand.deleteMany(),
  () => prisma.category.deleteMany(),
  () => prisma.supplier.deleteMany(),
  () => prisma.deliveryZone.deleteMany(),
];

async function main() {
  console.log("→ Suppression des données de démo (catalogue, clients, commandes, stock...)…");
  for (const deleteOp of deletes) {
    await deleteOp();
  }
  console.log("✔ Données de démo effacées. Comptes staff, rôles et paramètres conservés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
