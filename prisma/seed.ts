import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, permissionsFor } from "../src/lib/permissions";
import type { StaffRole } from "../src/generated/prisma/enums";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Génère une image de substitution locale (SVG) pour les données de démo,
// afin de ne dépendre d'aucun service externe (fonctionne hors-ligne).
const PLACEHOLDER_DIR = path.join(__dirname, "..", "public", "placeholders");
fs.mkdirSync(PLACEHOLDER_DIR, { recursive: true });

function hashToBool(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 2 === 0;
}

// Espace réservé à une vraie photo produit : plutôt qu'un fond de couleur
// aléatoire avec des initiales (qui donne une impression de site inachevé),
// une icône "photo" discrète sur un fond neutre aux couleurs de la marque —
// le même traitement que la plupart des sites marchands appliquent en
// attendant les vraies photos.
function img(seed: string, w = 800, h = 800) {
  const fileName = `${seed}.svg`;
  const filePath = path.join(PLACEHOLDER_DIR, fileName);
  const bg = hashToBool(seed) ? "#E7ECF3" : "#F4EFE3";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="${bg}" />
  <g opacity="0.32" stroke="#14213D" stroke-width="20" fill="none" stroke-linejoin="round" stroke-linecap="round">
    <rect x="200" y="240" width="400" height="320" rx="28" />
    <circle cx="300" cy="332" r="28" fill="#14213D" stroke="none" />
    <path d="M200 480 L338 372 L458 452 L540 392 L600 460" />
  </g>
</svg>`;
  fs.writeFileSync(filePath, svg);
  return `/placeholders/${fileName}`;
}

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

async function main() {
  console.log("→ Réinitialisation des données…");
  // Suppressions séquentielles (pas de transaction groupée) : sur une connexion
  // lente vers la base, une transaction interactive avec 30+ opérations dépasse
  // facilement le délai par défaut. L'ordre respecte les contraintes de clé
  // étrangère ; ce n'est qu'un nettoyage avant réinsertion, donc l'absence
  // d'atomicité n'est pas un problème (relancer le seed est sans danger).
  const resetDeletes = [
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
    () => prisma.employee.deleteMany(),
    () => prisma.rolePermission.deleteMany(),
    () => prisma.permission.deleteMany(),
    () => prisma.user.deleteMany(),
    () => prisma.loyaltyRule.deleteMany(),
    () => prisma.storeSettings.deleteMany(),
  ];
  for (const deleteOp of resetDeletes) {
    await deleteOp();
  }

  console.log("→ Paramètres du magasin & fidélité…");
  await prisma.storeSettings.create({
    data: {
      name: "ShopFlow",
      phone: "+224 622 00 11 22",
      email: "contact@shopflow.gn",
      address: "Boulevard du Commerce, Kaloum, Conakry",
      currency: "GNF",
      taxRatePct: 0,
    },
  });
  await prisma.loyaltyRule.create({ data: { gnfPerPoint: 10000, active: true } });

  console.log("→ Permissions & rôles…");
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.create({
        data: { key, label: key.replace(/[._]/g, " "), category: key.split(".")[0] },
      }),
    ),
  );
  const roles: StaffRole[] = ["ADMIN", "MANAGER", "CASHIER", "STOCK", "DELIVERY"];
  for (const role of roles) {
    const perms = permissionsFor(role);
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({
        role,
        permissionId: permissionRecords.find((r) => r.key === p)!.id,
      })),
    });
  }

  console.log("→ Équipe (staff)…");
  const admin = await prisma.user.create({
    data: {
      name: "Admin ShopFlow",
      email: "admin@shopflow.gn",
      phone: "+224 622 00 00 01",
      passwordHash: hash("Passer123!"),
      role: "ADMIN",
      employee: { create: { position: "Fondatrice / Gérante" } },
    },
  });
  const manager = await prisma.user.create({
    data: {
      name: "Fatoumata Camara",
      email: "fatoumata.camara@shopflow.gn",
      phone: "+224 622 00 00 02",
      passwordHash: hash("Passer123!"),
      role: "MANAGER",
      employee: { create: { position: "Responsable boutique" } },
    },
  });
  const cashier1 = await prisma.user.create({
    data: {
      name: "Mohamed Bah",
      email: "mohamed.bah@shopflow.gn",
      phone: "+224 622 00 00 03",
      passwordHash: hash("Passer123!"),
      role: "CASHIER",
      employee: { create: { position: "Caissier" } },
    },
  });
  const cashier2 = await prisma.user.create({
    data: {
      name: "Aïssatou Sow",
      email: "aissatou.sow@shopflow.gn",
      phone: "+224 622 00 00 04",
      passwordHash: hash("Passer123!"),
      role: "CASHIER",
      employee: { create: { position: "Caissière" } },
    },
  });
  const stockAgent = await prisma.user.create({
    data: {
      name: "Ibrahima Sory Diallo",
      email: "ibrahima.diallo@shopflow.gn",
      phone: "+224 622 00 00 05",
      passwordHash: hash("Passer123!"),
      role: "STOCK",
      employee: { create: { position: "Agent de stock" } },
    },
  });
  await prisma.user.create({
    data: {
      name: "Ousmane Diallo",
      email: "ousmane.diallo@shopflow.gn",
      phone: "+224 622 00 00 06",
      passwordHash: hash("Passer123!"),
      role: "DELIVERY",
      employee: { create: { position: "Livreur" } },
    },
  });

  console.log("→ Entrepôt & rangement…");
  const warehouse = await prisma.warehouse.create({
    data: { name: "Entrepôt Central Conakry", address: "Zone industrielle, Matoto", isDefault: true },
  });
  const locationDefs = [
    ["Rayon 1", "Étagère A", "Niveau 1"],
    ["Rayon 1", "Étagère A", "Niveau 2"],
    ["Rayon 1", "Étagère B", "Niveau 1"],
    ["Rayon 2", "Étagère A", "Niveau 1"],
    ["Rayon 2", "Étagère B", "Niveau 1"],
    ["Rayon 2", "Étagère B", "Niveau 2"],
    ["Rayon 3", "Étagère A", "Niveau 1"],
    ["Rayon 3", "Étagère B", "Niveau 2"],
  ] as const;
  const locations = [];
  for (const [aisle, shelf, level] of locationDefs) {
    const code = `${aisle.replace("Rayon ", "R")}-${shelf.replace("Étagère ", "")}-${level.replace("Niveau ", "N")}`;
    locations.push(
      await prisma.storageLocation.create({
        data: { warehouseId: warehouse.id, aisle, shelf, level, code },
      }),
    );
  }

  console.log("→ Fournisseurs…");
  const supplier1 = await prisma.supplier.create({
    data: {
      name: "Dubai Import Guinée",
      phone: "+224 664 11 22 33",
      email: "contact@dubaiimport.gn",
      address: "Madina Marché, Conakry",
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Sotelgui Distribution Électronique",
      phone: "+224 655 44 55 66",
      email: "vente@sotelgui-dist.gn",
      address: "Kaloum, Conakry",
    },
  });
  const supplier3 = await prisma.supplier.create({
    data: {
      name: "Import Mode Conakry",
      phone: "+224 621 77 88 99",
      email: "commande@importmode.gn",
      address: "Marché Niger, Conakry",
    },
  });

  console.log("→ Marques & catégories…");
  const brands: Record<string, Awaited<ReturnType<typeof prisma.brand.create>>> = {};
  for (const name of ["Samsung", "Infinix", "Tecno", "Nike", "Adidas", "ShopFlow Basics"]) {
    brands[name] = await prisma.brand.create({ data: { name } });
  }

  const catElectronique = await prisma.category.create({
    data: { name: "Électronique", slug: "electronique", imageUrl: img("cat-electronique") },
  });
  const catTelephones = await prisma.category.create({
    data: { name: "Téléphones", slug: "telephones", parentId: catElectronique.id, imageUrl: img("cat-telephones") },
  });
  const catAudio = await prisma.category.create({
    data: { name: "Audio & Accessoires", slug: "audio-accessoires", parentId: catElectronique.id, imageUrl: img("cat-audio") },
  });
  const catMode = await prisma.category.create({
    data: { name: "Mode", slug: "mode", imageUrl: img("cat-mode") },
  });
  const catHomme = await prisma.category.create({
    data: { name: "Homme", slug: "mode-homme", parentId: catMode.id, imageUrl: img("cat-homme") },
  });
  const catFemme = await prisma.category.create({
    data: { name: "Femme", slug: "mode-femme", parentId: catMode.id, imageUrl: img("cat-femme") },
  });
  const catMaison = await prisma.category.create({
    data: { name: "Maison & Cuisine", slug: "maison-cuisine", imageUrl: img("cat-maison") },
  });
  const catBeaute = await prisma.category.create({
    data: { name: "Beauté & Hygiène", slug: "beaute-hygiene", imageUrl: img("cat-beaute") },
  });

  console.log("→ Produits…");
  type ProductSeed = {
    name: string;
    categoryId: string;
    brand?: string;
    cost: number;
    price: number;
    promo?: number;
    desc: string;
    featured?: boolean;
    variants?: { size?: string; color?: string; delta?: number }[];
    threshold?: number;
  };

  const productDefs: ProductSeed[] = [
    { name: "Samsung Galaxy A15 128Go", categoryId: catTelephones.id, brand: "Samsung", cost: 1350000, price: 1650000, promo: 1499000, desc: "Écran 6.5\" AMOLED, 128Go de stockage, double SIM, garantie 12 mois.", featured: true },
    { name: "Infinix Hot 40 128Go", categoryId: catTelephones.id, brand: "Infinix", cost: 980000, price: 1250000, desc: "Batterie 5000mAh, charge rapide 33W, appareil photo 108MP.", featured: true },
    { name: "Tecno Spark 20 128Go", categoryId: catTelephones.id, brand: "Tecno", cost: 890000, price: 1120000, desc: "Design premium, grand écran 90Hz, 8Go RAM étendue.", },
    { name: "Samsung Galaxy A05 64Go", categoryId: catTelephones.id, brand: "Samsung", cost: 650000, price: 850000, desc: "Smartphone d'entrée de gamme fiable, idéal pour l'essentiel.", },
    { name: "Écouteurs Bluetooth ShopFlow Pro", categoryId: catAudio.id, brand: "ShopFlow Basics", cost: 85000, price: 150000, promo: 119000, desc: "Écouteurs sans fil, autonomie 20h avec boîtier de charge.", featured: true },
    { name: "Enceinte Bluetooth Portable 20W", categoryId: catAudio.id, brand: "ShopFlow Basics", cost: 140000, price: 220000, desc: "Son puissant, résistante aux éclaboussures, autonomie 10h.", },
    { name: "Chargeur rapide 33W + câble USB-C", categoryId: catAudio.id, brand: "ShopFlow Basics", cost: 35000, price: 65000, desc: "Chargeur universel compatible Android, charge rapide.", },
    { name: "Powerbank 20000mAh", categoryId: catAudio.id, brand: "ShopFlow Basics", cost: 95000, price: 165000, desc: "Double port USB, charge deux appareils à la fois.", },
    { name: "T-shirt Homme Col Rond", categoryId: catHomme.id, brand: "ShopFlow Basics", cost: 25000, price: 55000, desc: "100% coton, coupe confortable, plusieurs coloris.", variants: [
      { size: "S", color: "Noir" }, { size: "M", color: "Noir" }, { size: "L", color: "Noir" },
      { size: "M", color: "Blanc" }, { size: "L", color: "Blanc" },
    ] },
    { name: "Baskets Nike Revolution", categoryId: catHomme.id, brand: "Nike", cost: 280000, price: 420000, promo: 359000, desc: "Baskets running légères, semelle amortissante.", featured: true, variants: [
      { size: "40" }, { size: "41" }, { size: "42" }, { size: "43" }, { size: "44" },
    ] },
    { name: "Survêtement Adidas 3 Bandes", categoryId: catHomme.id, brand: "Adidas", cost: 220000, price: 340000, desc: "Ensemble jogging molleton, confortable et résistant.", variants: [
      { size: "M" }, { size: "L" }, { size: "XL" },
    ] },
    { name: "Robe Wax Élégance", categoryId: catFemme.id, brand: "ShopFlow Basics", cost: 120000, price: 210000, desc: "Robe en tissu wax authentique, motifs exclusifs.", featured: true, variants: [
      { size: "S" }, { size: "M" }, { size: "L" },
    ] },
    { name: "Sac à main Cuir Synthétique", categoryId: catFemme.id, brand: "ShopFlow Basics", cost: 90000, price: 165000, desc: "Sac élégant pour le quotidien, plusieurs compartiments.", },
    { name: "Sandales Femme Confort", categoryId: catFemme.id, brand: "ShopFlow Basics", cost: 45000, price: 85000, desc: "Sandales légères, semelle souple.", variants: [
      { size: "37" }, { size: "38" }, { size: "39" }, { size: "40" },
    ] },
    { name: "Service à thé complet (12 pièces)", categoryId: catMaison.id, brand: "ShopFlow Basics", cost: 95000, price: 160000, desc: "Set élégant en porcelaine pour recevoir vos invités.", },
    { name: "Marmite Inox 30cm", categoryId: catMaison.id, brand: "ShopFlow Basics", cost: 110000, price: 175000, desc: "Marmite robuste en inox, fond épais anti-adhérent.", },
    { name: "Mixeur électrique 3-en-1", categoryId: catMaison.id, brand: "ShopFlow Basics", cost: 160000, price: 250000, desc: "Mixeur, moulin et fouet en un seul appareil.", },
    { name: "Lot de 6 verres décorés", categoryId: catMaison.id, brand: "ShopFlow Basics", cost: 30000, price: 55000, desc: "Verres en verre trempé, motifs modernes.", },
    { name: "Crème hydratante corps 500ml", categoryId: catBeaute.id, brand: "ShopFlow Basics", cost: 28000, price: 48000, desc: "Formule nourrissante pour peau douce toute la journée.", },
    { name: "Parfum Homme Intense 100ml", categoryId: catBeaute.id, brand: "ShopFlow Basics", cost: 65000, price: 120000, promo: 99000, desc: "Fragrance boisée et épicée, longue tenue.", },
    { name: "Kit soins visage complet", categoryId: catBeaute.id, brand: "ShopFlow Basics", cost: 55000, price: 95000, desc: "Nettoyant, tonique et crème pour un teint éclatant.", },
  ];

  const products = [];
  let skuCounter = 1000;
  let variantBarcodeCounter = 900000000000;
  for (const def of productDefs) {
    const slug = def.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const sku = `SF-${skuCounter++}`;
    const barcode = `624${(2000000000 + skuCounter).toString().slice(0, 10)}`;
    const product = await prisma.product.create({
      data: {
        name: def.name,
        slug,
        description: def.desc,
        categoryId: def.categoryId,
        brandId: def.brand ? brands[def.brand].id : undefined,
        supplierId: [supplier1, supplier2, supplier3][skuCounter % 3].id,
        costPrice: def.cost,
        sellingPrice: def.price,
        promoPrice: def.promo ?? null,
        sku,
        barcode,
        lowStockThreshold: def.threshold ?? 5,
        featured: def.featured ?? false,
        images: {
          create: [0, 1].map((i) => ({ url: img(`${slug}-${i}`), position: i })),
        },
      },
    });

    if (def.variants?.length) {
      for (const v of def.variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: v.size,
            color: v.color,
            sku: `${sku}-${v.size ?? ""}${v.color ?? ""}`.replace(/\s+/g, ""),
            barcode: `${(variantBarcodeCounter++).toString()}`,
            priceDelta: v.delta ?? 0,
          },
        });
      }
    }
    products.push(product);
  }

  console.log("→ Stock initial…");
  let locIdx = 0;
  const stockLevels = [42, 3, 0, 18, 27, 60, 8, 15, 4, 33];
  for (const product of products) {
    const variants = await prisma.productVariant.findMany({ where: { productId: product.id } });
    const targets = variants.length ? variants : [null];
    for (const variant of targets) {
      const location = locations[locIdx % locations.length];
      locIdx++;
      const qty = stockLevels[locIdx % stockLevels.length];
      await prisma.inventory.create({
        data: {
          productId: product.id,
          variantId: variant?.id ?? null,
          locationId: location.id,
          quantity: qty,
        },
      });
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          variantId: variant?.id ?? null,
          locationId: location.id,
          type: "RESTOCK",
          quantity: qty,
          reason: "Stock initial",
          userId: stockAgent.id,
        },
      });
    }
  }

  console.log("→ Zones de livraison…");
  const zoneKaloum = await prisma.deliveryZone.create({ data: { name: "Kaloum", fee: 15000, estimatedDays: 1 } });
  const zoneRatoma = await prisma.deliveryZone.create({ data: { name: "Ratoma", fee: 25000, estimatedDays: 1 } });
  await prisma.deliveryZone.create({ data: { name: "Matam", fee: 20000, estimatedDays: 1 } });
  await prisma.deliveryZone.create({ data: { name: "Dixinn", fee: 20000, estimatedDays: 1 } });
  await prisma.deliveryZone.create({ data: { name: "Matoto", fee: 30000, estimatedDays: 2 } });

  console.log("→ Promotions & coupons…");
  const promo = await prisma.promotion.create({
    data: {
      name: "Semaine Électronique -10%",
      type: "PERCENT",
      value: 10,
      categoryId: catElectronique.id,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      usageLimit: 200,
    },
  });
  await prisma.coupon.create({
    data: { code: "BIENVENUE10", promotionId: promo.id, usageLimit: 500, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
  });

  console.log("→ Clients…");
  const customerDefs = [
    { name: "Mariam Diallo", phone: "+224 660 11 22 01", email: "mariam.diallo@gmail.com", city: "Ratoma" },
    { name: "Alpha Oumar Barry", phone: "+224 660 11 22 02", email: "alpha.barry@gmail.com", city: "Kaloum" },
    { name: "Kadiatou Bangoura", phone: "+224 660 11 22 03", email: "kadiatou.b@gmail.com", city: "Matam" },
    { name: "Sékou Condé", phone: "+224 660 11 22 04", email: "sekou.conde@gmail.com", city: "Dixinn" },
    { name: "Hawa Keita", phone: "+224 660 11 22 05", email: "hawa.keita@gmail.com", city: "Matoto" },
    { name: "Mamadou Saliou Bah", phone: "+224 660 11 22 06", email: "saliou.bah@gmail.com", city: "Ratoma" },
    { name: "Fanta Touré", phone: "+224 660 11 22 07", email: "fanta.toure@gmail.com", city: "Kaloum" },
    { name: "Bakary Soumah", phone: "+224 660 11 22 08", email: "bakary.soumah@gmail.com", city: "Matam" },
  ];
  const customers = [];
  for (const c of customerDefs) {
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        passwordHash: hash("Client123!"),
        addresses: {
          create: {
            label: "Domicile",
            fullAddress: `Quartier ${c.city}, près du marché`,
            city: c.city,
            phone: c.phone,
            isDefault: true,
          },
        },
      },
      include: { addresses: true },
    });
    customers.push(customer);
  }

  await prisma.favorite.createMany({
    data: [
      { customerId: customers[0].id, productId: products[9].id },
      { customerId: customers[0].id, productId: products[0].id },
      { customerId: customers[2].id, productId: products[11].id },
      { customerId: customers[4].id, productId: products[4].id },
    ],
  });

  console.log("→ Commandes, paiements & fidélité…");
  const orderStatuses = ["DELIVERED", "DELIVERED", "SHIPPED", "PREPARING", "PAID", "CONFIRMED", "NEW", "CANCELLED", "DELIVERED", "PAID"] as const;
  const paymentMethods = ["ORANGE_MONEY", "MTN_MOMO", "CASH", "CARD", "QR_CODE"] as const;

  for (let i = 0; i < 16; i++) {
    const customer = customers[i % customers.length];
    const channel = i % 3 === 0 ? "POS" : "ONLINE";
    const employee = channel === "POS" ? [cashier1, cashier2][i % 2] : undefined;
    const itemCount = 1 + (i % 3);
    const chosenProducts = [products[i % products.length], products[(i + 3) % products.length]].slice(0, itemCount);

    let subtotal = 0;
    const itemsData = chosenProducts.map((p, idx) => {
      const qty = 1 + (idx % 2);
      const unitPrice = p.promoPrice ?? p.sellingPrice;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      return {
        productId: p.id,
        nameSnapshot: p.name,
        unitPrice,
        quantity: qty,
        subtotal: lineTotal,
      };
    });

    const discount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
    const deliveryFee = channel === "ONLINE" ? [zoneKaloum, zoneRatoma][i % 2].fee : 0;
    const total = subtotal - discount + deliveryFee;
    const status = orderStatuses[i % orderStatuses.length];
    const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * (16 - i));

    const order = await prisma.order.create({
      data: {
        orderNumber: `CMD-${2601}${(1000 + i).toString().slice(-3)}`,
        channel,
        customerId: customer.id,
        employeeId: employee?.id,
        addressId: channel === "ONLINE" ? customer.addresses[0]?.id : undefined,
        deliveryMethod: channel === "ONLINE" ? "STANDARD" : "PICKUP",
        status,
        subtotal,
        discount,
        deliveryFee,
        total,
        createdAt,
        items: { create: itemsData },
        statusHistory: {
          create: { status, note: "Création de la commande", createdAt },
        },
      },
    });

    const paymentStatus = status === "CANCELLED" ? "CANCELLED" : status === "NEW" ? "PENDING" : "SUCCEEDED";
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: paymentMethods[i % paymentMethods.length],
        amount: total,
        status: paymentStatus,
      },
    });

    if (channel === "ONLINE" && status !== "CANCELLED" && status !== "NEW") {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          zoneId: [zoneKaloum, zoneRatoma][i % 2].id,
          method: "STANDARD",
          status: status === "DELIVERED" ? "DELIVERED" : status === "SHIPPED" ? "IN_TRANSIT" : "PENDING",
          deliveredAt: status === "DELIVERED" ? createdAt : null,
        },
      });
    }

    if (paymentStatus === "SUCCEEDED") {
      const points = Math.floor(total / 10000);
      if (points > 0) {
        await prisma.loyaltyTransaction.create({
          data: { customerId: customer.id, orderId: order.id, points, type: "EARN", createdAt },
        });
        await prisma.customer.update({
          where: { id: customer.id },
          data: { loyaltyPoints: { increment: points } },
        });
      }
    }
  }

  console.log("→ Notifications de démonstration…");
  await prisma.notification.createMany({
    data: [
      {
        audience: "STAFF",
        userId: admin.id,
        title: "Stock faible",
        body: "Il reste seulement 3 unités de Samsung Galaxy A15 128Go.",
        type: "warning",
      },
      {
        audience: "STAFF",
        userId: manager.id,
        title: "Nouvelle commande reçue",
        body: "Commande CMD-2601015 en attente de préparation.",
        type: "info",
      },
      {
        audience: "CUSTOMER",
        customerId: customers[0].id,
        title: "Commande expédiée",
        body: "Votre commande a été expédiée et arrive bientôt.",
        type: "success",
      },
    ],
  });

  console.log("→ Journal d'audit…");
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "settings.update",
      entityType: "StoreSettings",
      metadata: { field: "currency", value: "GNF" },
    },
  });

  console.log("✔ Seed terminé.");
  console.log("\nComptes de démonstration (mot de passe: Passer123!):");
  console.log("  admin@shopflow.gn (ADMIN)");
  console.log("  fatoumata.camara@shopflow.gn (MANAGER)");
  console.log("  mohamed.bah@shopflow.gn (CASHIER)");
  console.log("  ibrahima.diallo@shopflow.gn (STOCK)");
  console.log("Client de démonstration (mot de passe: Client123!): +224 660 11 22 01");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
