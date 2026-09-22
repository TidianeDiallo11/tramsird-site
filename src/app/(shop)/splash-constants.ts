// Constante partagée entre le Server Component (page.tsx, qui lit le cookie)
// et le Client Component (onboarding-splash.tsx, qui l'écrit) : à isoler dans
// un fichier sans "use client", car dans cette version de Next.js, une
// valeur exportée depuis un module "use client" devient une référence de
// fonction côté serveur plutôt que la valeur elle-même.
export const SPLASH_DISMISSED_COOKIE = "nl-trading-splash-dismissed";
