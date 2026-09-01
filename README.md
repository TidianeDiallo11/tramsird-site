# ShopFlow

Plateforme de commerce tout-en-un (boutique en ligne + caisse/POS + gestion
de stock, entrepôt, commandes, clients, fournisseurs, promotions, fidélité,
employés et paiements Mobile Money) pour un commerce en Guinée.

Stack : Next.js 16 (App Router, TypeScript), Tailwind CSS v4, PostgreSQL +
Prisma, authentification par session (JWT + cookies httpOnly).

## Démarrage local

1. **Base de données** — créez une base PostgreSQL et renseignez son URL
   dans `.env` (copiez `.env.example`) :

   ```bash
   cp .env.example .env
   # éditez DATABASE_URL et AUTH_SECRET dans .env
   ```

2. **Dépendances et schéma** :

   ```bash
   npm install
   npm run db:migrate   # applique le schéma Prisma
   npm run db:seed       # données de démonstration réalistes
   npm run dev
   ```

3. Ouvrez [http://localhost:3000](http://localhost:3000).

### Comptes de démonstration (après `npm run db:seed`)

| Rôle | Email / téléphone | Mot de passe |
|---|---|---|
| Administrateur | admin@shopflow.gn | Passer123! |
| Manager | fatoumata.camara@shopflow.gn | Passer123! |
| Caissier | mohamed.bah@shopflow.gn | Passer123! |
| Agent de stock | ibrahima.diallo@shopflow.gn | Passer123! |
| Livreur | ousmane.diallo@shopflow.gn | Passer123! |
| Client | +224 660 11 22 01 | Client123! |

L'espace équipe (admin + caisse) est accessible sur `/staff-login`.

## Paiements Mobile Money

Le `PaymentService` (`src/lib/payments/`) est prêt à connecter les API
officielles d'Orange Money, MTN Mobile Money et un prestataire carte : tant
que les clés correspondantes ne sont pas renseignées dans les variables
d'environnement (voir `.env.example`), ces moyens de paiement refusent
toute transaction plutôt que de simuler un succès. Les espèces (caisse ou
livraison) sont confirmées par un membre du personnel ; les webhooks des
opérateurs arrivent sur `/api/webhooks/payments/[provider]`.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` / `npm run start` — build et exécution en production
- `npm run lint` — ESLint
- `npm run db:migrate` — migrations Prisma
- `npm run db:seed` — réinitialise et recharge les données de démonstration
- `npm run db:studio` — interface Prisma Studio pour explorer la base

## Déploiement

Déployez sur n'importe quel hébergeur Node.js (Vercel, Railway, etc.) avec
une base PostgreSQL managée (Neon, Supabase, Railway…). Pensez à :

- définir `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` en production ;
- exécuter `npm run db:migrate` puis, si besoin, `npm run db:seed` sur la
  base de production ;
- renseigner les clés des opérateurs Mobile Money une fois les contrats
  signés (voir `.env.example`).

L'ancien site vitrine (Vite/React) est conservé pour référence dans
`legacy-streetwear-site/` et n'est plus utilisé par l'application.
