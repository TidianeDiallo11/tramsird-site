import type { MetadataRoute } from "next";
import { getStoreBranding } from "@/lib/store-branding";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await getStoreBranding();

  return {
    name: branding.name,
    short_name: branding.name,
    description: `${branding.name} — boutique, caisse et gestion en un seul endroit.`,
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfa",
    theme_color: "#fbfbfa",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
