import { CartProvider } from "@/components/cart/cart-provider";
import { SiteHeader } from "@/components/shop/site-header";
import { MobileBottomNav } from "@/components/shop/mobile-bottom-nav";
import { SiteFooter } from "@/components/shop/site-footer";
import { getCustomerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getStoreBranding } from "@/lib/store-branding";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [customer, branding] = await Promise.all([getCustomerSession(), getStoreBranding()]);
  const unreadNotifications = customer
    ? await prisma.notification.count({ where: { audience: "CUSTOMER", customerId: customer.sub, read: false } })
    : 0;

  return (
    <CartProvider>
      <div className="flex min-h-svh flex-col">
        <SiteHeader
          customerName={customer?.name ?? null}
          unreadNotifications={unreadNotifications}
          storeName={branding.name}
          logoUrl={branding.logoUrl}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <SiteFooter storeName={branding.name} logoUrl={branding.logoUrl} />
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
}
