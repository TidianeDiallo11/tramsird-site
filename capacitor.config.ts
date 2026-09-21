import type { CapacitorConfig } from "@capacitor/cli";

// L'appli mobile ne contient pas de copie du site : elle affiche simplement
// le site déployé dans une WebView native. C'est nécessaire car ce projet
// utilise des Server Actions, des sessions par cookie et un accès direct à
// la base de données côté serveur — incompatible avec un export statique.
const config: CapacitorConfig = {
  appId: "gn.nltrading.app",
  appName: "NL Trading",
  webDir: "www",
  server: {
    url: "https://tramsird-site.vercel.app",
    androidScheme: "https",
  },
};

export default config;
