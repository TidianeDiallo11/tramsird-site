import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

// Exécuté à chaque déploiement (voir "vercel-build" dans package.json).
// Ne fait RIEN si un seul compte staff existe déjà, pour ne jamais écraser
// un mot de passe changé par un vrai utilisateur. Ne crée un compte admin
// que si la table est totalement vide (première mise en service) ET que
// DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD sont configurées sur Vercel
// (Project Settings → Environment Variables) — aucun mot de passe en dur ici.
neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    console.log(`ensure-admin: ${existingCount} compte(s) staff déjà présent(s), aucune action.`);
    return;
  }

  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "ensure-admin: aucun compte staff trouvé, mais DEFAULT_ADMIN_EMAIL et/ou DEFAULT_ADMIN_PASSWORD " +
        "ne sont pas configurées — aucun compte créé. Ajoutez ces variables dans Vercel " +
        "(Project Settings → Environment Variables) puis redéployez.",
    );
    return;
  }

  await prisma.user.create({
    data: {
      name: "Administrateur",
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "ADMIN",
    },
  });

  console.log(`ensure-admin: aucun compte staff trouvé — compte admin créé (${email}).`);
}

main()
  .catch((err) => {
    console.error("ensure-admin: erreur, déploiement non bloqué.", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
