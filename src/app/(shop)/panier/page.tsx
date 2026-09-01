import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Mon panier" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-bold">Mon panier</h1>
      <CartView />
    </div>
  );
}
