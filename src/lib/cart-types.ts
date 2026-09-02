export type CartItem = {
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
};

export type CartState = {
  items: CartItem[];
  couponCode: string | null;
};
