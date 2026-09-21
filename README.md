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

## Application mobile (Android / iOS)

L'appli mobile n'embarque pas de copie du site : elle affiche le site déployé
(`capacitor.config.ts` → `server.url`) dans une WebView native via
[Capacitor](https://capacitorjs.com). C'est nécessaire car le site utilise
des Server Actions, des sessions par cookie et un accès direct à la base de
données côté serveur, incompatibles avec un export statique embarqué.

### Android

- `npm run android:sync` — recopie `capacitor.config.ts` vers le projet
  natif après une modification (URL du site, nom de l'appli…).
- `npm run android:open` — ouvre le projet dans Android Studio.
- `npm run android:assets` — régénère les icônes/splash à partir de
  `resources/icon.png` (1024×1024) et `resources/splash.png` (2732×2732).

Un workflow GitHub Actions (`.github/workflows/android-build.yml`) compile
automatiquement un APK de debug à chaque changement dans `android/` poussé
sur `main`, téléchargeable depuis l'onglet **Actions** du dépôt — sans
installer Android Studio. Pour publier sur le **Play Store**, il faut en
plus :

1. Un compte développeur Google Play (25 $, paiement unique).
2. Une build **release** signée (`./gradlew bundleRelease` avec une
   clé de signature — voir la
   [doc Capacitor](https://capacitorjs.com/docs/android/deploying-to-google-play)).
3. La créer/soumettre depuis la Play Console (fiche, captures d'écran,
   politique de confidentialité).

### iOS

Nécessite un Mac avec Xcode (impossible à générer/compiler depuis cet
environnement). Une fois sur un Mac : `npx cap add ios`, puis suivre le même
principe qu'Android. Publier sur l'**App Store** nécessite un compte
développeur Apple (99 $/an) et passe par une revue plus stricte qu'Android.

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
