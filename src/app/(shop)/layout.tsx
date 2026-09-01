import { CartProvider } from "@/components/cart/cart-provider";
import { SiteHeader } from "@/components/shop/site-header";
import { MobileBottomNav } from "@/components/shop/mobile-bottom-nav";
import { SiteFooter } from "@/components/shop/site-footer";
import { getCustomerSession } from "@/lib/session";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomerSession();

  return (
    <CartProvider>
      <div className="flex min-h-svh flex-col">
        <SiteHeader customerName={customer?.name ?? null} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <SiteFooter />
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
}
