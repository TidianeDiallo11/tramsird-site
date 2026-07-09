import React, { useState, useEffect } from "react";
import { ShoppingBag, Check, ChevronLeft, CreditCard, Smartphone, Plus, Minus, Truck, Loader2, AlertCircle } from "lucide-react";

const API_BASE_URL = "https://tramsird-backend-production.up.railway.app/api";

const CURRENCIES = {
  XOF: { label: "FCFA (Afrique de l'Ouest)", symbol: "FCFA", rate: 1 },
  XAF: { label: "FCFA (Afrique Centrale)", symbol: "FCFA", rate: 1 },
  EUR: { label: "Euro", symbol: "e", rate: 0.00152 },
  USD: { label: "Dollar US", symbol: "$", rate: 0.00164 },
};

function formatPrice(amountXOF, currencyCode) {
  const c = CURRENCIES[currencyCode];
  const value = amountXOF * c.rate;
  if (currencyCode === "XOF" || currencyCode === "XAF") {
    return `${Math.round(value).toLocaleString("fr-FR")} ${c.symbol}`;
  }
  return `${value.toFixed(2)} ${c.symbol}`;
}

async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) throw new Error("Impossible de charger les produits.");
  return res.json();
}

async function fetchContent() {
  const res = await fetch(`${API_BASE_URL}/content`);
  if (!res.ok) throw new Error("Impossible de charger le contenu du site.");
  return res.json();
}

const DEFAULT_CONTENT = {
  home_eyebrow: "DROP N1 - COLLECTION SAHEL",
  home_title_line1: "PORTE",
  home_title_line2: "TON",
  home_title_line3: "HERITAGE",
  home_subtitle: "Tramsird habille la rue avec des coupes larges et des motifs puises dans le wax. Fabrique en petites series, pense pour durer.",
  collection_heading: "LA COLLECTION",
  feature_1_label: "01 - MATIERE",
  feature_1_text: "Molleton 380g, brode main",
  feature_2_label: "02 - LIVRAISON",
  feature_2_text: "Expedie sous 48h, suivi inclus",
  feature_3_label: "03 - PAIEMENT",
  feature_3_text: "Carte bancaire ou Orange Money",
  footer_text: "2026 Tramsird - Fabrique avec fierte",
  success_title: "COMMANDE CONFIRMEE",
  success_text: "Un e-mail de confirmation te sera envoye. Ta commande part vers toi sous 48h.",
};

async function createOrder(payload) {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de creer la commande.");
  return data;
}

function WaxPattern({ className, opacity = 1 }) {
  return (
    <svg className={className} style={{ opacity }} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wax" width="50" height="50" patternUnits="userSpaceOnUse">
          <circle cx="25" cy="25" r="3" fill="currentColor" />
          <path d="M0 25 Q12.5 10 25 25 Q37.5 40 50 25" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M25 0 Q10 12.5 25 25 Q40 37.5 25 50" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#wax)" />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [currency, setCurrency] = useState("XOF");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);

  const [content, setContent] = useState(DEFAULT_CONTENT);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [cart, setCart] = useState([]);

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setProductsLoading(false);
      })
      .catch((err) => {
        setProductsError(err.message);
        setProductsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchContent()
      .then((data) => setContent((prev) => ({ ...prev, ...data })))
      .catch((err) => console.warn("Contenu du site non charge:", err.message));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const SHIPPING = 2000;
  const total = cartTotal + (cartCount > 0 ? SHIPPING : 0);

  function openProduct(product) {
    setActiveProduct(product);
    setSelectedColor(product.colors?.[0]?.name || null);
    setSelectedSize(product.sizes?.[0] || null);
    setView("product");
  }

  function addToCart() {
    if (!activeProduct) return;
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === activeProduct.id && i.color === selectedColor && i.size === selectedSize
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          productId: activeProduct.id,
          name: activeProduct.name,
          price: activeProduct.price,
          color: selectedColor,
          size: selectedSize,
          qty: 1,
        },
      ];
    });
    setView("cart");
  }

  function updateQty(idx, delta) {
    setCart((prev) => {
      const copy = [...prev];
      const newQty = copy[idx].qty + delta;
      if (newQty <= 0) return copy.filter((_, i) => i !== idx);
      copy[idx] = { ...copy[idx], qty: newQty };
      return copy;
    });
  }

  async function handleSubmitOrder() {
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const payload = {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        currency,
        items: cart.map((i) => ({
          productId: i.productId,
          color: i.color,
          size: i.size,
          qty: i.qty,
        })),
      };
      const result = await createOrder(payload);
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error("Aucun lien de paiement recu.");
      }
    } catch (err) {
      setCheckoutError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#141110] text-[#F2E9DD] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Anton', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
        ::selection { background: #C4562B; color: #141110; }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(196,86,43,0.5); } 100% { box-shadow: 0 0 0 16px rgba(196,86,43,0); } }
        .pulse-ring { animation: pulse-ring 1.5s ease-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <Header
        cartCount={cartCount}
        onCartClick={() => setView("cart")}
        onLogoClick={() => setView("home")}
        currency={currency}
        setCurrency={setCurrency}
      />

      {view === "home" && (
        <Home
          products={products}
          loading={productsLoading}
          error={productsError}
          currency={currency}
          onSelectProduct={openProduct}
          content={content}
        />
      )}

      {view === "product" && activeProduct && (
        <ProductView
          product={activeProduct}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          onAdd={addToCart}
          onBack={() => setView("home")}
          onBack={() => setView("home")}
          currency={currency}
        />
      )}

      {view === "cart" && (
        <CartView
          cart={cart}
          updateQty={updateQty}
          currency={currency}
          cartTotal={cartTotal}
          onCheckout={() => setView("checkout")}
          onBack={() => setView("home")}
          onContinueShopping={() => setView("home")}
        />
      )}

      {view === "checkout" && (
        <CheckoutView
          cart={cart}
          currency={currency}
          cartTotal={cartTotal}
          shipping={SHIPPING}
          total={total}
          customer={customer}
          setCustomer={setCustomer}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          submitting={submitting}
          error={checkoutError}
          onSubmit={handleSubmitOrder}
          onBack={() => setView("cart")}
        />
      )}

      {view === "success" && <SuccessView content={content} onBackHome={() => { setCart([]); setView("home"); }} />}

      <Footer content={content} />
    </div>
  );
}

function Header({ cartCount, onCartClick, onLogoClick, currency, setCurrency }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2a2521] bg-[#141110]/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <button onClick={onLogoClick} className="font-display text-2xl tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] rounded-sm">
          TRAMSIRD
        </button>
        <div className="flex items-center gap-4">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Choisir la devise"
            className="hidden sm:block bg-transparent border border-[#3a332c] text-xs font-mono text-[#F2E9DD] rounded-sm px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B]"
          >
            {Object.entries(CURRENCIES).map(([code]) => (
              <option key={code} value={code} className="bg-[#141110]">
                {code}
              </option>
            ))}
          </select>
          <button
            onClick={onCartClick}
            className="relative p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] rounded-sm"
            aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
          >
            <ShoppingBag size={22} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C4562B] text-[#141110] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function Home({ products, loading, error, currency, onSelectProduct, content }) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-[#2a2521]">
        <WaxPattern className="absolute -right-20 -top-20 w-[500px] h-[500px] text-[#C4562B]" opacity={0.12} />
        <WaxPattern className="absolute -left-32 bottom-0 w-[400px] h-[400px] text-[#E8A33D]" opacity={0.08} />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <p className="font-mono text-xs tracking-[0.25em] text-[#E8A33D] mb-4">{content.home_eyebrow}</p>
          <h1 className="font-display text-[15vw] sm:text-[7rem] leading-[0.85] tracking-tight mb-6">
            {content.home_title_line1}<br />{content.home_title_line2}<br /><span className="text-[#C4562B]">{content.home_title_line3}</span>
          </h1>
          <p className="max-w-md text-[#c9beae] text-base mb-8">
            {content.home_subtitle}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <h2 className="font-display text-2xl mb-8">{content.collection_heading}</h2>

        {loading && (
          <div className="flex items-center gap-3 text-[#c9beae] font-mono text-sm">
            <Loader2 size={18} className="animate-spin" /> Chargement des produits...
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 border border-[#B84B3E]/40 bg-[#B84B3E]/10 rounded-sm p-5 text-sm">
            <AlertCircle size={18} className="text-[#e08477] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Impossible de charger les produits</p>
              <p className="text-[#c9beae] font-mono text-xs">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="text-[#c9beae] font-mono text-sm">
            Aucun produit disponible pour le moment.
          </p>
        )}

        {!loading && products.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const hex = product.colors?.[0]?.hex || "#C4562B";
              return (
                <button
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] rounded-sm"
                >
                  <div
                    className="aspect-[4/5] rounded-sm relative overflow-hidden flex items-end justify-center border border-[#2a2521] mb-3"
                    style={{ backgroundColor: hex }}
                  >
                    <WaxPattern className="absolute inset-0 w-full h-full text-[#141110]" opacity={0.15} />
                    <div className="relative z-10 font-display text-[#141110]/80 text-xl pb-6 tracking-wide group-hover:scale-105 transition-transform">
                      TRAMSIRD
                    </div>
                  </div>
                  <p className="font-bold text-sm">{product.name}</p>
                  <p className="text-xs text-[#7a6f60] mb-1">{product.tagline}</p>
                  <p className="font-mono text-sm text-[#C4562B]">{formatPrice(product.price, currency)}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 border-t border-[#2a2521]">
        <div className="grid sm:grid-cols-3 gap-6 font-mono text-xs">
          <div className="border border-[#2a2521] p-5 rounded-sm">
            <p className="text-[#E8A33D] mb-1">{content.feature_1_label}</p>
            <p className="text-[#c9beae]">{content.feature_1_text}</p>
          </div>
          <div className="border border-[#2a2521] p-5 rounded-sm">
            <p className="text-[#E8A33D] mb-1">{content.feature_2_label}</p>
            <p className="text-[#c9beae]">{content.feature_2_text}</p>
          </div>
          <div className="border border-[#2a2521] p-5 rounded-sm">
            <p className="text-[#E8A33D] mb-1">{content.feature_3_label}</p>
            <p className="text-[#c9beae]">{content.feature_3_text}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductView({ product, selectedColor, setSelectedColor, selectedSize, setSelectedSize, onAdd, onBack, currency }) {
  const colorHex = product.colors.find((c) => c.name === selectedColor)?.hex || "#C4562B";
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-[#c9beae] hover:text-[#F2E9DD] mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] rounded-sm">
        <ChevronLeft size={16} /> Retour
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        <div
          className="aspect-[4/5] rounded-sm relative overflow-hidden flex items-end justify-center border border-[#2a2521]"
          style={{ backgroundColor: colorHex }}
        >
          <WaxPattern className="absolute inset-0 w-full h-full text-[#141110]" opacity={0.15} />
          <div className="relative z-10 font-display text-[#141110]/80 text-3xl pb-8 tracking-wide">
            TRAMSIRD
          </div>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-[#E8A33D] mb-2">DROP N01</p>
          <h1 className="font-display text-4xl mb-2">{product.name}</h1>
          <p className="text-[#c9beae] mb-4">{product.tagline}</p>
          <p className="font-mono text-2xl text-[#C4562B] mb-6">{formatPrice(product.price, currency)}</p>

          <p className="text-sm text-[#c9beae] leading-relaxed mb-8">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold tracking-wide mb-3">COULEUR - {selectedColor}</p>
              <div className="flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={c.name}
                    aria-pressed={selectedColor === c.name}
                    className="w-10 h-10 rounded-full border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E9DD]"
                    style={{
                      backgroundColor: c.hex,
                      borderColor: selectedColor === c.name ? "#F2E9DD" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold tracking-wide mb-3">TAILLE</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    aria-pressed={selectedSize === s}
                    className={`w-12 h-12 rounded-sm font-mono text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] ${
                      selectedSize === s
                        ? "bg-[#F2E9DD] text-[#141110] border-[#F2E9DD]"
                        : "border-[#3a332c] text-[#F2E9DD] hover:border-[#C4562B]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="w-full bg-[#C4562B] text-[#141110] font-bold py-4 rounded-sm hover:bg-[#E8A33D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E9DD] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? "Ajouter au panier" : "Rupture de stock"}
          </button>
          <p className="font-mono text-[11px] text-[#7a6f60] mt-3">{product.stock} en stock</p>
        </div>
      </div>
    </div>
  );
}

function CartView({ cart, updateQty, currency, cartTotal, onCheckout, onBack, onContinueShopping }) {
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-24 text-center">
        <ShoppingBag size={40} className="mx-auto mb-4 text-[#3a332c]" />
        <h2 className="font-display text-2xl mb-2">TON PANIER EST VIDE</h2>
        <p className="text-[#c9beae] mb-6 text-sm">Ajoute un article pour commencer ta commande.</p>
        <button
          onClick={onContinueShopping}
          className="inline-flex bg-[#C4562B] text-[#141110] font-bold px-6 py-3 rounded-sm hover:bg-[#E8A33D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E9DD]"
        >
          Voir la collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-[#c9beae] hover:text-[#F2E9DD] mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] rounded-sm">
        <ChevronLeft size={16} /> Continuer mes achats
      </button>
      <h1 className="font-display text-3xl mb-8">TON PANIER</h1>

      <div className="space-y-4 mb-8">
        {cart.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 border border-[#2a2521] rounded-sm p-4">
            <div className="w-16 h-16 rounded-sm flex-shrink-0 bg-[#3a332c] flex items-center justify-center font-mono text-[10px] text-[#7a6f60]">
              {item.color}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{item.name}</p>
              <p className="font-mono text-xs text-[#7a6f60]">{item.color} - Taille {item.size}</p>
            </div>
            <div className="flex items-center gap-3 border border-[#3a332c] rounded-sm">
              <button onClick={() => updateQty(idx, -1)} className="p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B]" aria-label="Diminuer la quantite">
                <Minus size={14} />
              </button>
              <span className="font-mono text-sm w-4 text-center">{item.qty}</span>
              <button onClick={() => updateQty(idx, 1)} className="p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B]" aria-label="Augmenter la quantite">
                <Plus size={14} />
              </button>
            </div>
            <p className="font-mono text-sm w-24 text-right">{formatPrice(item.price * item.qty, currency)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-[#2a2521] pt-6 flex justify-between items-center mb-8">
        <p className="font-mono text-sm text-[#c9beae]">Sous-total</p>
        <p className="font-mono text-xl">{formatPrice(cartTotal, currency)}</p>
      </div>

      <button
        onClick={onCheckout}
        className="w-full bg-[#C4562B] text-[#141110] font-bold py-4 rounded-sm hover:bg-[#E8A33D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E9DD]"
      >
        Passer au paiement
      </button>
    </div>
  );
}

function CheckoutView({
  cart, currency, cartTotal, shipping, total,
  customer, setCustomer,
  paymentMethod, setPaymentMethod,
  submitting, error, onSubmit, onBack,
}) {
  const canSubmit =
    customer.name.trim().length > 1 &&
    customer.email.trim().includes("@") &&
    customer.phone.trim().length >= 8 &&
    customer.address.trim().length > 4;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={onBack} disabled={submitting} className="inline-flex items-center gap-1 text-sm text-[#c9beae] hover:text-[#F2E9DD] mb-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] rounded-sm disabled:opacity-40">
        <ChevronLeft size={16} /> Retour au panier
      </button>
      <h1 className="font-display text-3xl mb-8">PAIEMENT</h1>

      <div className="border border-[#2a2521] rounded-sm p-5 mb-8 font-mono text-sm space-y-2">
        <div className="flex justify-between"><span className="text-[#7a6f60]">Articles ({cart.reduce((s, i) => s + i.qty, 0)})</span><span>{formatPrice(cartTotal, currency)}</span></div>
        <div className="flex justify-between"><span className="text-[#7a6f60] flex items-center gap-1"><Truck size={13} /> Livraison</span><span>{formatPrice(shipping, currency)}</span></div>
        <div className="flex justify-between text-lg pt-2 border-t border-[#2a2521] mt-2"><span>Total</span><span className="text-[#C4562B]">{formatPrice(total, currency)}</span></div>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-xs font-bold tracking-wide text-[#c9beae]">TES COORDONNEES</p>
        <Field label="Nom complet">
          <input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Aicha Diallo"
            disabled={submitting}
            className="w-full bg-transparent border border-[#3a332c] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] disabled:opacity-50"
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            placeholder="aicha@exemple.com"
            disabled={submitting}
            className="w-full bg-transparent border border-[#3a332c] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] disabled:opacity-50"
          />
        </Field>
        <Field label="Telephone">
          <input
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="07 XX XX XX XX"
            inputMode="tel"
            disabled={submitting}
            className="w-full bg-transparent border border-[#3a332c] rounded-sm px-3 py-3 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] disabled:opacity-50"
          />
        </Field>
        <Field label="Adresse de livraison">
          <input
            value={customer.address}
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            placeholder="Quartier, ville, pays"
            disabled={submitting}
            className="w-full bg-transparent border border-[#3a332c] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] disabled:opacity-50"
          />
        </Field>
      </div>

      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-[#c9beae] mb-3">MODE DE PAIEMENT PREFERE</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod("card")}
            disabled={submitting}
            aria-pressed={paymentMethod === "card"}
            className={`flex flex-col items-center gap-2 py-5 rounded-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] disabled:opacity-50 ${
              paymentMethod === "card" ? "border-[#C4562B] bg-[#C4562B]/10" : "border-[#2a2521] hover:border-[#3a332c]"
            }`}
          >
            <CreditCard size={22} />
            <span className="text-sm font-bold">Carte bancaire</span>
          </button>
          <button
            onClick={() => setPaymentMethod("orange")}
            disabled={submitting}
            aria-pressed={paymentMethod === "orange"}
            className={`flex flex-col items-center gap-2 py-5 rounded-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4562B] disabled:opacity-50 ${
              paymentMethod === "orange" ? "border-[#FF6600] bg-[#FF6600]/10" : "border-[#2a2521] hover:border-[#3a332c]"
            }`}
          >
            <Smartphone size={22} className="text-[#FF6600]" />
            <span className="text-sm font-bold">Orange Money</span>
          </button>
        </div>
        <p className="text-[11px] text-[#7a6f60] font-mono mt-3">
          Tu confirmeras ton choix exact sur la page suivante.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 border border-[#B84B3E]/40 bg-[#B84B3E]/10 rounded-sm p-4 mb-6 text-sm">
          <AlertCircle size={18} className="text-[#e08477] flex-shrink-0 mt-0.5" />
          <p className="text-[#e08477]">{error}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="w-full bg-[#C4562B] text-[#141110] font-bold py-4 rounded-sm hover:bg-[#E8A33D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E9DD] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Preparation du paiement...
          </>
        ) : (
          `Continuer vers le paiement - ${formatPrice(total, currency)}`
        )}
      </button>

      <p className="text-[11px] text-[#7a6f60] font-mono text-center mt-4">
        Paiement traite par CinetPay.
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold tracking-wide mb-2 text-[#c9beae]">{label}</label>
      {children}
    </div>
  );
}

function SuccessView({ content, onBackHome }) {
  return (
    <div className="max-w-md mx-auto px-5 sm:px-8 py-28 text-center">
      <div className="w-16 h-16 rounded-full bg-[#2F5233] flex items-center justify-center mx-auto mb-6">
        <Check size={30} />
      </div>
      <h1 className="font-display text-3xl mb-3">{content.success_title}</h1>
      <p className="text-[#c9beae] text-sm mb-8 font-mono">
        {content.success_text}
      </p>
      <button
        onClick={onBackHome}
        className="inline-flex bg-[#C4562B] text-[#141110] font-bold px-6 py-3 rounded-sm hover:bg-[#E8A33D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F2E9DD]"
      >
        Retour a l'accueil
      </button>
    </div>
  );
}

function Footer({ content }) {
  return (
    <footer className="border-t border-[#2a2521] mt-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row justify-between gap-4 items-center">
        <p className="font-display text-lg">TRAMSIRD</p>
        <p className="text-xs text-[#7a6f60] font-mono">{content.footer_text}</p>
      </div>
    </footer>
  );
}
