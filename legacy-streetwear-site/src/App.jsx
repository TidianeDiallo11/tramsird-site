import React, { useState, useEffect } from "react";
import { ShoppingBag, Check, ChevronDown, CreditCard, Smartphone, Plus, Minus, Truck, Globe, Loader2, AlertCircle, Instagram, XCircle, Menu, X, Package, User, LogOut, Eye, EyeOff, Mail, Search, Trash2 } from "lucide-react";

const CATEGORIES = [
  { slug: "all", label: "Tous les produits" },
  { slug: "t-shirts", label: "T-shirts" },
  { slug: "shorts", label: "Shorts" },
  { slug: "pantalons", label: "Pantalons" },
  { slug: "survetements", label: "Survetements" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "jerseys", label: "Jerseys" },
  { slug: "accessoires", label: "Accessoires" },
];

const API_BASE_URL = "https://tramsird-backend.onrender.com/api";
const DEFAULT_HERO_IMAGE = "/hero-guinea.jpg";

const CURRENCIES = {
  GNF: { label: "Franc Guineen", symbol: "GNF", rate: 1 },
  EUR: { label: "Euro", symbol: "e", rate: 0.000105 },
  USD: { label: "Dollar US", symbol: "$", rate: 0.000116 },
};

function formatPrice(amountGNF, currencyCode) {
  const c = CURRENCIES[currencyCode];
  const value = amountGNF * c.rate;
  if (currencyCode === "GNF") {
    return `${Math.round(value).toLocaleString("fr-FR")} ${c.symbol}`;
  }
  return `${value.toFixed(2)} ${c.symbol}`;
}

function getProductImages(product) {
  if (product.images && product.images.length) return product.images;
  if (product.image_url) return [product.image_url];
  return [];
}

function getSizeEntries(product) {
  if (!Array.isArray(product.sizes)) return [];
  return product.sizes.map((s) =>
    typeof s === "string" ? { size: s, stock: null } : { size: s.size, stock: s.stock }
  );
}

async function fetchProducts() {
  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) throw new Error("Impossible de charger les produits.");
  return res.json();
}

async function fetchPreorderProducts() {
  const res = await fetch(`${API_BASE_URL}/products?preorder=1`);
  if (!res.ok) throw new Error("Impossible de charger les produits en precommande.");
  return res.json();
}

async function createPreorder(payload) {
  const res = await fetch(`${API_BASE_URL}/preorders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible d'envoyer la precommande.");
  return data;
}

async function fetchContent() {
  const res = await fetch(`${API_BASE_URL}/content`);
  if (!res.ok) throw new Error("Impossible de charger le contenu du site.");
  return res.json();
}

const DEFAULT_CONTENT = {
  header_logo_url: "",
  hero_image_url: "",
  home_eyebrow: "GUINEA IS OURS",
  home_title_line1: "FCTTW",
  collection_heading: "LA COLLECTION",
  feature_1_label: "01 - MATIERE",
  feature_1_text: "Molleton 380g, brode main",
  feature_2_label: "02 - LIVRAISON",
  feature_2_text: "Expedie sous 48h, suivi inclus",
  feature_3_label: "03 - PAIEMENT",
  feature_3_text: "Carte bancaire ou Orange Money",
  values_heading: "NOS VALEURS",
  value_1_title: "UNION",
  value_1_text: "Le projet se construit a plusieurs : la complementarite des talents compte plus que le culte d'une seule personne.",
  value_2_title: "DEVOTION",
  value_2_text: "Une ambition forte n'a de valeur que suivie de travail, de constance et d'une attention reelle a l'execution.",
  value_3_title: "OBJECTIVITE",
  value_3_text: "Regarder nos forces comme nos faiblesses : mesurer, corriger et progresser plutot que romantiser le fait d'etre une marque locale.",
  slogan_signature: "GUINEA IS OURS. — FROM CONAKRY TO THE WORLD",
  footer_text: "2026 Tramsird - Fabrique avec fierte",
  success_title: "COMMANDE CONFIRMEE",
  success_text: "Un e-mail de confirmation te sera envoye. Ta commande part vers toi sous 48h.",
  about_heading: "NOTRE HISTOIRE",
  about_text: "Nous ne sommes pas nes de l'envie de reproduire une marque etrangere en Guinee, mais de creer depuis la Guinee, avec nos propres references.\n\nLe vetement reste l'un de nos terrains d'expression, mais nous developpons aussi des experiences culturelles et evenementielles : BLACK OUT, BLACK OUT LEVEL UP ou FUN HOUSE en sont l'illustration. Nous ne sommes pas qu'a la recherche de profits en vendant nos produits, car nous avons pour obligation principale de reaffirmer la grandeur de notre continent.\n\nNotre vision : participer a l'emergence d'un continent capable de creer, produire et faire circuler davantage ses propres references culturelles, creatives et economiques. L'autosuffisance d'un continent ne depend evidemment pas d'une marque de vetements : notre role est de contribuer, a notre echelle, a une culture de creation, de propriete, de production et de confiance dans ce qui vient d'ici.\n\nGUINEA IS OURS. — FROM CONAKRY TO THE WORLD.",
  social_instagram: "",
  social_tiktok: "",
  product_size_chart: "XS : tour de poitrine 86-91cm\nS : tour de poitrine 91-96cm\nM : tour de poitrine 96-101cm\nL : tour de poitrine 101-106cm\nXL : tour de poitrine 106-111cm\n2XL : tour de poitrine 111-116cm",
  product_size_guide: "Nos coupes sont oversize. Si tu hesites entre deux tailles, prends la taille en-dessous pour une coupe plus ajustee.",
  product_material: "Molleton 380g/m², coton epais, brode main.",
  product_delivery: "Expedie depuis Conakry sous 48h. Suivi de commande inclus.",
  product_shipping_note: "Livraison partout en Guinee, tarifs calcules au paiement.",
};

async function createOrder(payload, customerToken) {
  const headers = { "Content-Type": "application/json" };
  if (customerToken) headers.Authorization = `Bearer ${customerToken}`;
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de creer la commande.");
  return data;
}

async function registerCustomer(payload) {
  const res = await fetch(`${API_BASE_URL}/customers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de creer le compte.");
  return data;
}

async function loginCustomer(payload) {
  const res = await fetch(`${API_BASE_URL}/customers/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de te connecter.");
  return data;
}

async function fetchCustomerMe(token) {
  const res = await fetch(`${API_BASE_URL}/customers/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Session expiree.");
  return data;
}

async function updateCustomerMe(token, payload) {
  const res = await fetch(`${API_BASE_URL}/customers/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de mettre a jour le profil.");
  return data;
}

async function fetchCustomerOrders(token) {
  const res = await fetch(`${API_BASE_URL}/customers/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de charger tes commandes.");
  return data;
}

async function forgotPassword(email) {
  const res = await fetch(`${API_BASE_URL}/customers/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible d'envoyer le lien.");
  return data;
}

async function resetPassword(payload) {
  const res = await fetch(`${API_BASE_URL}/customers/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de reinitialiser le mot de passe.");
  return data;
}

async function validatePromoCode(code, subtotal) {
  const res = await fetch(`${API_BASE_URL}/promocodes/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Code promo invalide.");
  return data;
}

async function capturePaypalOrder(orderId) {
  const res = await fetch(`${API_BASE_URL}/payments/paypal/capture/${orderId}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de confirmer le paiement PayPal.");
  return data;
}

async function fetchPaymentStatus(orderId) {
  const res = await fetch(`${API_BASE_URL}/payments/status/${orderId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Impossible de verifier le statut du paiement.");
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

function TikTokIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.6 5.82c-.98-.87-1.6-2.08-1.72-3.82h-3.25v13.9c0 1.63-1.32 2.95-2.95 2.95a2.95 2.95 0 0 1-2.95-2.95 2.95 2.95 0 0 1 2.95-2.95c.28 0 .55.04.8.11v-3.3a6.25 6.25 0 0 0-.8-.05A6.25 6.25 0 0 0 2.53 16 6.25 6.25 0 0 0 8.78 22.25 6.25 6.25 0 0 0 15.03 16V9.01a9.4 9.4 0 0 0 5.44 1.75V7.5a5.75 5.75 0 0 1-3.87-1.68z" />
    </svg>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [currency, setCurrency] = useState("GNF");
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);

  const [content, setContent] = useState(DEFAULT_CONTENT);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [zoomState, setZoomState] = useState(null);
  const [cart, setCart] = useState([]);
  const [flowMode, setFlowMode] = useState("shop");

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [promoChecking, setPromoChecking] = useState(false);

  const [accountToken, setAccountToken] = useState(() => localStorage.getItem("tramsird_customer_token") || null);
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountOrders, setAccountOrders] = useState([]);
  const [accountMode, setAccountMode] = useState("login");
  const [accountForm, setAccountForm] = useState({ name: "", email: "", password: "", phone: "", address: "", identifier: "" });
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountError, setAccountError] = useState(null);

  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnIsPaypal, setReturnIsPaypal] = useState(false);
  const [returnCancelled, setReturnCancelled] = useState(false);

  const [resetParams, setResetParams] = useState(null);

  const [preorderProducts, setPreorderProducts] = useState([]);
  const [preorderProductsLoading, setPreorderProductsLoading] = useState(false);
  const [preorderProductsError, setPreorderProductsError] = useState(null);
  const [preorderCart, setPreorderCart] = useState([]);
  const [preorderCustomer, setPreorderCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [preorderSubmitting, setPreorderSubmitting] = useState(false);
  const [preorderError, setPreorderError] = useState(null);

  useEffect(() => {
    const match = window.location.pathname.match(/^\/commande\/([^/]+)/);
    if (match) {
      const params = new URLSearchParams(window.location.search);
      setReturnOrderId(match[1]);
      setReturnIsPaypal(params.has("token"));
      setReturnCancelled(params.get("cancelled") === "1");
      setView("orderStatus");
      window.history.replaceState({ view: "orderStatus", categoryFilter: "all", flowMode: "shop", productId: null }, "");
      return;
    }

    const resetMatch = window.location.pathname.match(/^\/reinitialiser\/([^/]+)\/([^/]+)/);
    if (resetMatch) {
      setResetParams({ customerId: resetMatch[1], token: resetMatch[2] });
      setView("resetPassword");
      window.history.replaceState({ view: "resetPassword", categoryFilter: "all", flowMode: "shop", productId: null }, "");
      return;
    }

    window.history.replaceState({ view: "home", categoryFilter: "all", flowMode: "shop", productId: null }, "");
  }, []);

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

  useEffect(() => {
    document.body.style.overflow = zoomState ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoomState]);

  useEffect(() => {
    if (!accountToken) {
      setAccount(null);
      return;
    }
    setAccountLoading(true);
    fetchCustomerMe(accountToken)
      .then((data) => {
        setAccount(data);
        fetchCustomerOrders(accountToken).then(setAccountOrders).catch(() => {});
      })
      .catch(() => {
        localStorage.removeItem("tramsird_customer_token");
        setAccountToken(null);
        setAccount(null);
      })
      .finally(() => setAccountLoading(false));
  }, [accountToken]);

  function openAccount() {
    setAccountError(null);
    navigate("account");
  }

  async function handleAccountSubmit() {
    setAccountSubmitting(true);
    setAccountError(null);
    try {
      const result =
        accountMode === "login"
          ? await loginCustomer({ identifier: accountForm.identifier, password: accountForm.password })
          : await registerCustomer(accountForm);
      localStorage.setItem("tramsird_customer_token", result.token);
      setAccountToken(result.token);
      setAccount(result.customer);
      setAccountForm({ name: "", email: "", password: "", phone: "", address: "", identifier: "" });
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setAccountSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("tramsird_customer_token");
    setAccountToken(null);
    setAccount(null);
    setAccountOrders([]);
    navigate("home");
  }

  useEffect(() => {
    if (!account) return;
    setCustomer((prev) =>
      prev.name || prev.email
        ? prev
        : { name: account.name, email: account.email || "", phone: account.phone || "", address: account.address || "" }
    );
  }, [account]);

  function loadAccountOrders() {
    if (!accountToken) return;
    fetchCustomerOrders(accountToken)
      .then(setAccountOrders)
      .catch((err) => console.warn("Commandes non chargees:", err.message));
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const SHIPPING = 2000;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const total = Math.max(0, cartTotal - discountAmount) + (cartCount > 0 ? SHIPPING : 0);

  async function applyPromoCode() {
    if (!promoCodeInput.trim()) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(promoCodeInput.trim(), cartTotal);
      setAppliedPromo(result);
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.message);
    } finally {
      setPromoChecking(false);
    }
  }

  function removePromoCode() {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  }

  function navigate(nextView, updates = {}) {
    const nextCategoryFilter = updates.categoryFilter !== undefined ? updates.categoryFilter : categoryFilter;
    const nextFlowMode = updates.flowMode !== undefined ? updates.flowMode : flowMode;
    const nextProduct = updates.activeProduct !== undefined ? updates.activeProduct : activeProduct;

    if (updates.categoryFilter !== undefined) setCategoryFilter(updates.categoryFilter);
    if (updates.flowMode !== undefined) setFlowMode(updates.flowMode);
    if (updates.activeProduct !== undefined) setActiveProduct(updates.activeProduct);
    setView(nextView);

    window.history.pushState(
      { view: nextView, categoryFilter: nextCategoryFilter, flowMode: nextFlowMode, productId: nextProduct?.id || null },
      ""
    );
  }

  useEffect(() => {
    function handlePopState(e) {
      const state = e.state;
      if (!state || !state.view) return;
      setView(state.view);
      if (state.categoryFilter !== undefined) setCategoryFilter(state.categoryFilter);
      if (state.flowMode !== undefined) setFlowMode(state.flowMode);
      if (state.productId) {
        const list = state.flowMode === "preorder" ? preorderProducts : products;
        const found = list.find((p) => p.id === state.productId);
        if (found) setActiveProduct(found);
      } else {
        setActiveProduct(null);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [products, preorderProducts]);

  function openProduct(product, mode = "shop") {
    setSelectedColor(product.colors?.[0]?.name || null);
    const sizeEntries = getSizeEntries(product);
    const firstAvailable = sizeEntries.find((s) => s.stock !== 0) || sizeEntries[0];
    setSelectedSize(firstAvailable?.size || null);
    setSelectedQty(1);
    navigate("product", { activeProduct: product, flowMode: mode });
  }

  function openPrecommande() {
    navigate("precommande");
    setPreorderProductsLoading(true);
    setPreorderProductsError(null);
    fetchPreorderProducts()
      .then((data) => {
        setPreorderProducts(data);
        setPreorderProductsLoading(false);
      })
      .catch((err) => {
        setPreorderProductsError(err.message);
        setPreorderProductsLoading(false);
      });
  }

  function addToCart() {
    if (!activeProduct) return;
    const setList = flowMode === "preorder" ? setPreorderCart : setCart;
    setList((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === activeProduct.id && i.color === selectedColor && i.size === selectedSize
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + selectedQty };
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
          qty: selectedQty,
          image: getProductImages(activeProduct)[0] || null,
        },
      ];
    });
    navigate(flowMode === "preorder" ? "preorderCart" : "cart");
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

  function updatePreorderQty(idx, delta) {
    setPreorderCart((prev) => {
      const copy = [...prev];
      const newQty = copy[idx].qty + delta;
      if (newQty <= 0) return copy.filter((_, i) => i !== idx);
      copy[idx] = { ...copy[idx], qty: newQty };
      return copy;
    });
  }

  function removeFromCart(idx) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeFromPreorderCart(idx) {
    setPreorderCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function quickAddToCart(product, size) {
    const color = product.colors?.[0]?.name || null;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.color === color && i.size === size);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          color,
          size,
          qty: 1,
          image: getProductImages(product)[0] || null,
        },
      ];
    });
  }

  function quickAddToPreorderCart(product, size) {
    const color = product.colors?.[0]?.name || null;
    setPreorderCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.color === color && i.size === size);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          color,
          size,
          qty: 1,
          image: getProductImages(product)[0] || null,
        },
      ];
    });
  }

  async function handleSubmitPreorder() {
    setPreorderSubmitting(true);
    setPreorderError(null);
    try {
      const payload = {
        customerName: preorderCustomer.name,
        customerEmail: preorderCustomer.email,
        customerPhone: preorderCustomer.phone,
        shippingAddress: preorderCustomer.address,
        items: preorderCart.map((i) => ({
          productId: i.productId,
          color: i.color,
          size: i.size,
          qty: i.qty,
        })),
      };
      await createPreorder(payload);
      navigate("preorderSuccess");
    } catch (err) {
      setPreorderError(err.message);
    } finally {
      setPreorderSubmitting(false);
    }
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
        paymentMethod,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          color: i.color,
          size: i.size,
          qty: i.qty,
        })),
      };
      const result = await createOrder(payload, accountToken);
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Inter:wght@400;500;600;700;800&display=swap');
        :root {
          --bg: #F3E7D1;
          --bg-soft: #EADEC0;
          --ink: #1C1712;
          --muted: #6E5D45;
          --line: #E1D0A9;
          --line-strong: #CBB587;
          --accent: #6F4E19;
          --accent-dark: #4C3410;
          --tag: #A91101;
          --purple: #694D75;
          --sky: #99C2E8;
          --navy: #1B1F3C;
        }
        .font-display { font-family: 'Playfair Display', serif; font-weight: 800; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Inter', sans-serif; letter-spacing: 0.03em; }
        ::selection { background: var(--accent); color: var(--bg); }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(111,78,25,0.5); } 100% { box-shadow: 0 0 0 16px rgba(111,78,25,0); } }
        .pulse-ring { animation: pulse-ring 1.5s ease-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-page-in { animation: page-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes swipe-hint { 0%, 100% { transform: translateX(0); } 35% { transform: translateX(-18px); } 65% { transform: translateX(4px); } }
        .animate-swipe-hint { animation: swipe-hint 900ms ease-out 700ms 1; }
        @keyframes kenburns { 0% { transform: scale(1); } 100% { transform: scale(1.06); } }
        .animate-kenburns { animation: kenburns 9s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate; }
        .group:hover .animate-kenburns { animation-play-state: paused; }
        @keyframes aurora-drift-1 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 50% { transform: translate(8%, 6%) scale(1.15); } }
        @keyframes aurora-drift-2 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 50% { transform: translate(-8%, -8%) scale(1.1); } }
        @keyframes aurora-drift-3 { 0%, 100% { transform: translate(0%, 0%) scale(1); } 50% { transform: translate(-6%, 8%) scale(1.2); } }
        .animate-aurora-1 { animation: aurora-drift-1 16s ease-in-out infinite; }
        .animate-aurora-2 { animation: aurora-drift-2 20s ease-in-out infinite; }
        .animate-aurora-3 { animation: aurora-drift-3 24s ease-in-out infinite; }
        button { transition: color 150ms ease, transform 150ms ease; }
        button:not(:disabled):active:not([class*="bg-[var(--accent)]"]) {
          color: var(--accent);
          transform: scale(0.96);
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <Header
        cartCount={cartCount}
        onCartClick={() => navigate("cart")}
        onLogoClick={() => navigate("home", { categoryFilter: "all" })}
        onMenuClick={() => setMenuOpen(true)}
        currency={currency}
        setCurrency={setCurrency}
        logoUrl={content.header_logo_url}
        isLoggedIn={!!account}
        onAccountClick={() => {
          if (account) loadAccountOrders();
          openAccount();
        }}
      />

      <CategoryDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categoryFilter={categoryFilter}
        onSelectCategory={(slug) => {
          navigate("category", { categoryFilter: slug, flowMode: "shop" });
          setMenuOpen(false);
        }}
        onSelectPreorder={() => {
          openPrecommande();
          setMenuOpen(false);
        }}
      />

      {zoomState && (
        <ZoomOverlay
          images={zoomState.images}
          index={zoomState.index}
          onClose={() => setZoomState(null)}
        />
      )}

      {view === "home" && <HomeHero content={content} />}

      <div key={view} className="relative z-10 animate-page-in">
        {view === "home" && (
          <Home
            products={products}
            loading={productsLoading}
            error={productsError}
            currency={currency}
            onSelectProduct={(p) => openProduct(p, "shop")}
            onQuickAdd={quickAddToCart}
            content={content}
          />
        )}

        {view === "category" && (
          <CategoryView
            category={CATEGORIES.find((c) => c.slug === categoryFilter) || CATEGORIES[0]}
            products={products}
            loading={productsLoading}
            error={productsError}
            currency={currency}
            onSelectProduct={(p) => openProduct(p, "shop")}
            onQuickAdd={quickAddToCart}
          />
        )}

        {view === "precommande" && (
          <PrecommandeView
            products={preorderProducts}
            loading={preorderProductsLoading}
            error={preorderProductsError}
            currency={currency}
            onSelectProduct={(p) => openProduct(p, "preorder")}
            onQuickAdd={quickAddToPreorderCart}
          />
        )}

        {view === "product" && activeProduct && (
          <ProductView
            key={activeProduct.id}
            product={activeProduct}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedQty={selectedQty}
            setSelectedQty={setSelectedQty}
            onAdd={addToCart}
            currency={currency}
            mode={flowMode}
            onZoom={(images, idx) => setZoomState({ images, index: idx })}
            content={content}
          />
        )}

        {view === "cart" && (
          <CartView
            cart={cart}
            updateQty={updateQty}
            onRemove={removeFromCart}
            currency={currency}
            cartTotal={cartTotal}
            onCheckout={() => navigate("checkout")}
            onContinueShopping={() => navigate("home")}
            showPromo
            promoCodeInput={promoCodeInput}
            setPromoCodeInput={setPromoCodeInput}
            appliedPromo={appliedPromo}
            onApplyPromo={applyPromoCode}
            onRemovePromo={removePromoCode}
            promoError={promoError}
            promoChecking={promoChecking}
            discountAmount={discountAmount}
          />
        )}

        {view === "preorderCart" && (
          <CartView
            cart={preorderCart}
            updateQty={updatePreorderQty}
            onRemove={removeFromPreorderCart}
            currency={currency}
            cartTotal={preorderCart.reduce((s, i) => s + i.qty * i.price, 0)}
            onCheckout={() => navigate("preorderCheckout")}
            onContinueShopping={() => navigate("precommande")}
            title="TA PRECOMMANDE"
            emptyTitle="AUCUNE SELECTION"
            emptyText="Ajoute un article disponible en precommande pour continuer."
            continueLabel="Voir les produits en precommande"
            checkoutLabel="Envoyer ma precommande"
          />
        )}

        {view === "preorderCheckout" && (
          <PreorderCheckoutView
            cart={preorderCart}
            currency={currency}
            customer={preorderCustomer}
            setCustomer={setPreorderCustomer}
            submitting={preorderSubmitting}
            error={preorderError}
            onSubmit={handleSubmitPreorder}
          />
        )}

        {view === "preorderSuccess" && (
          <SuccessView
            content={{
              success_title: "PRECOMMANDE ENVOYEE",
              success_text: "Merci pour ta precommande. Nous te recontacterons tres prochainement pour la confirmer.",
            }}
            onBackHome={() => {
              setPreorderCart([]);
              setPreorderCustomer({ name: "", email: "", phone: "", address: "" });
              navigate("home", { flowMode: "shop" });
            }}
          />
        )}

        {view === "checkout" && (
          <CheckoutView
            cart={cart}
            currency={currency}
            cartTotal={cartTotal}
            shipping={SHIPPING}
            total={total}
            appliedPromo={appliedPromo}
            discountAmount={discountAmount}
            customer={customer}
            setCustomer={setCustomer}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            submitting={submitting}
            error={checkoutError}
            onSubmit={handleSubmitOrder}
          />
        )}

        {view === "orderStatus" && (
          <OrderStatusView
            orderId={returnOrderId}
            isPaypal={returnIsPaypal}
            cancelled={returnCancelled}
            content={content}
            onBackHome={() => {
              window.history.replaceState(null, "", "/");
              setCart([]);
              navigate("home");
            }}
          />
        )}

        {view === "success" && <SuccessView content={content} onBackHome={() => { setCart([]); navigate("home"); }} />}

        {view === "resetPassword" && resetParams && (
          <ResetPasswordView
            customerId={resetParams.customerId}
            token={resetParams.token}
            onDone={() => {
              window.history.replaceState(null, "", "/");
              setAccountMode("login");
              navigate("account");
            }}
          />
        )}

        {view === "about" && <AboutView content={content} />}

        {view === "account" && (
          <AccountView
            account={account}
            accountLoading={accountLoading}
            accountOrders={accountOrders}
            accountMode={accountMode}
            setAccountMode={setAccountMode}
            accountForm={accountForm}
            setAccountForm={setAccountForm}
            accountSubmitting={accountSubmitting}
            accountError={accountError}
            onSubmit={handleAccountSubmit}
            onLogout={handleLogout}
            currency={currency}
          />
        )}
      </div>

      <Footer content={content} onNavigateAbout={() => navigate("about")} />
    </div>
  );
}

function Header({ cartCount, onCartClick, onLogoClick, onMenuClick, currency, setCurrency, logoUrl, isLoggedIn, onAccountClick }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onMenuClick}
            aria-label="Ouvrir le menu des categories"
            className="p-2 -ml-2 rounded-sm text-[var(--ink)] hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <button onClick={onLogoClick} className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="TRAMSIRD" className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-2xl tracking-wide">TRAMSIRD</span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Choisir la devise"
            className="hidden sm:block bg-transparent border border-[var(--line-strong)] text-xs font-mono text-[var(--ink)] rounded-sm px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {Object.entries(CURRENCIES).map(([code]) => (
              <option key={code} value={code} className="bg-[var(--bg)]">
                {code}
              </option>
            ))}
          </select>
          <button
            onClick={onAccountClick}
            className="relative p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
            aria-label={isLoggedIn ? "Mon compte" : "Se connecter"}
          >
            <User size={22} strokeWidth={1.75} />
            {isLoggedIn && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
            )}
          </button>
          <button
            onClick={onCartClick}
            className="relative p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
            aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
          >
            <ShoppingBag size={22} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-[var(--bg)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function CategoryDrawer({ open, onClose, categoryFilter, onSelectCategory, onSelectPreorder }) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu des categories"
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-[var(--bg-soft)] border-r border-[var(--line)] z-50 shadow-2xl transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--line)]">
          <span className="font-display text-xl tracking-wide">TRAMSIRD</span>
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="p-2 -mr-2 rounded-sm text-[var(--ink)] hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="py-2 overflow-y-auto">
          <button
            onClick={onSelectPreorder}
            className="w-full text-left px-5 py-4 font-mono text-sm font-bold tracking-wide border-b border-[var(--line)] bg-[var(--tag)]/10 text-[var(--tag)] transition-colors hover:bg-[var(--tag)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tag)]"
          >
            PRECOMMANDE
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => onSelectCategory(c.slug)}
              aria-current={categoryFilter === c.slug ? "true" : undefined}
              className={`w-full text-left px-5 py-4 font-mono text-sm tracking-wide border-b border-[var(--line)] transition-colors hover:bg-[var(--line)] hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                categoryFilter === c.slug ? "text-[var(--accent)]" : "text-[var(--ink)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

function ProductCard({ product, currency, onSelect, onQuickAdd, badge, className = "", style }) {
  const images = getProductImages(product);
  const sizeEntries = getSizeEntries(product);
  const hasSizes = sizeEntries.length > 0;
  const outOfStock = hasSizes ? sizeEntries.every((s) => s.stock === 0) : product.stock <= 0;
  const scrollRef = React.useRef(null);
  const [activeImage, setActiveImage] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    setActiveImage(Math.round(el.scrollLeft / el.clientWidth));
  }

  const autoAdvanceStoppedRef = React.useRef(false);

  function stopAutoAdvance() {
    autoAdvanceStoppedRef.current = true;
  }

  function goToImage(idx) {
    stopAutoAdvance();
    const el = scrollRef.current;
    if (el && el.clientWidth) {
      el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    }
  }

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;

    let intervalId = null;

    const startTimeout = setTimeout(() => {
      if (autoAdvanceStoppedRef.current) return;
      intervalId = setInterval(() => {
        if (autoAdvanceStoppedRef.current || !el.clientWidth) return;
        const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % images.length;
        // Wrapping back to the first photo snaps instantly instead of scrolling backwards through every photo.
        el.scrollTo({ left: next * el.clientWidth, behavior: next === 0 ? "auto" : "smooth" });
      }, 2500);
    }, 2500);

    el.addEventListener("pointerdown", stopAutoAdvance);
    el.addEventListener("wheel", stopAutoAdvance, { passive: true });

    return () => {
      clearTimeout(startTimeout);
      if (intervalId) clearInterval(intervalId);
      el.removeEventListener("pointerdown", stopAutoAdvance);
      el.removeEventListener("wheel", stopAutoAdvance);
    };
  }, [images.length]);

  function handlePlusClick(e) {
    e.stopPropagation();
    if (outOfStock) return;
    if (hasSizes) setPickerOpen(true);
    else onQuickAdd(product, null);
  }

  function handlePickSize(size) {
    onQuickAdd(product, size);
    setPickerOpen(false);
  }

  return (
    <div className={`w-full ${className}`} style={style}>
      <div className="aspect-[4/5] relative mb-6">
        <div className="absolute inset-0 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={`w-full h-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory bg-[var(--bg-soft)] no-scrollbar ${
              images.length > 1 ? "animate-swipe-hint" : ""
            }`}
            style={{ scrollbarWidth: "none" }}
          >
            {images.length > 0 ? (
              images.map((img, idx) => (
                <button key={idx} onClick={onSelect} className="w-full h-full flex-shrink-0 snap-start focus:outline-none">
                  <img src={img} alt={product.name} className="w-full h-full object-cover" />
                </button>
              ))
            ) : (
              <button onClick={onSelect} className="w-full h-full flex-shrink-0 snap-start relative focus:outline-none">
                <WaxPattern className="absolute inset-0 w-full h-full text-[#141110]" opacity={0.1} />
                <div className="absolute inset-0 flex items-end justify-center pb-6">
                  <span className="font-display text-[#141110]/70 text-xl tracking-wide">TRAMSIRD</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToImage(idx);
                }}
                aria-label={`Photo ${idx + 1}`}
                className="p-1.5 -m-1.5 focus:outline-none"
              >
                <span
                  className={`block w-1.5 h-1.5 rounded-full transition-colors ${idx === activeImage ? "bg-[var(--ink)]" : "bg-[var(--ink)]/25"}`}
                />
              </button>
            ))}
          </div>
        )}

        {badge && (
          <span className="absolute top-2 left-2 z-10 bg-[var(--tag)] text-[var(--bg)] text-[10px] font-bold font-mono px-2 py-1 rounded-sm">
            {badge}
          </span>
        )}

        {onQuickAdd && (
          <div className="absolute inset-x-0 bottom-0 z-10">
            {pickerOpen ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white/95 flex items-center gap-3 overflow-x-auto px-3 py-2 no-scrollbar"
                style={{ scrollbarWidth: "none" }}
              >
                {sizeEntries.map((s) => {
                  const sizeOut = s.stock === 0;
                  return (
                    <button
                      key={s.size}
                      onClick={() => !sizeOut && handlePickSize(s.size)}
                      disabled={sizeOut}
                      className={`flex-shrink-0 font-mono text-xs ${
                        sizeOut ? "text-[var(--muted)] line-through opacity-50" : "text-[var(--ink)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center translate-y-1/2">
                <button
                  onClick={handlePlusClick}
                  disabled={outOfStock}
                  aria-label="Ajouter au panier"
                  className="w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={onSelect} className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm">
        <p className="font-bold text-sm text-center leading-snug">{product.name}</p>
        <p className="font-mono text-sm text-[var(--muted)] text-center mt-1">{formatPrice(product.price, currency)}</p>
      </button>
    </div>
  );
}

function HomeHero({ content }) {
  const heroImage = content.hero_image_url || DEFAULT_HERO_IMAGE;
  return (
    <div className="fixed inset-0 h-[100dvh] w-full z-0 overflow-hidden pointer-events-none">
      <img src={heroImage} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141110] via-[#141110]/20 to-transparent" />
      <div className="absolute bottom-10 left-5 sm:left-10 right-5">
        <p className="font-mono text-[10px] tracking-[0.3em] text-white/85 mb-2">{content.home_eyebrow || DEFAULT_CONTENT.home_eyebrow}</p>
        <h1 className="font-display text-white text-[20vw] sm:text-[7rem] leading-[0.85] tracking-tight">
          {content.home_title_line1 || DEFAULT_CONTENT.home_title_line1}
        </h1>
      </div>
    </div>
  );
}

function Home({ products, loading, error, currency, onSelectProduct, onQuickAdd, content }) {
  const featuredProducts = products.filter((p) => p.featured);
  const collectionProducts = featuredProducts.length > 0 ? featuredProducts : products;

  return (
    <div>
      {/* Spacer reserving the hero's height; the actual hero visual is fixed and rendered at the App level (see HomeHero) so it isn't confined by .animate-page-in's transform. */}
      <div className="h-[100dvh]" />

      <section className="relative bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <h2 className="font-display text-2xl">{content.collection_heading}</h2>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-[var(--muted)] font-mono text-sm">
              <Loader2 size={18} className="animate-spin" /> Chargement des produits...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-sm p-5 text-sm">
              <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Impossible de charger les produits</p>
                <p className="text-[var(--muted)] font-mono text-xs">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && collectionProducts.length === 0 && (
            <p className="text-[var(--muted)] font-mono text-sm">
              Aucun produit disponible pour le moment.
            </p>
          )}

          {!loading && collectionProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
              {collectionProducts.map((product, idx) => (
                <Reveal key={product.id} delay={Math.min(idx, 8) * 60}>
                  <ProductCard product={product} currency={currency} onSelect={() => onSelectProduct(product)} onQuickAdd={onQuickAdd} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 bg-[var(--ink)] text-[var(--bg)] py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <p className="font-mono text-xs tracking-[0.25em] text-[var(--sky)] mb-3">{content.values_heading}</p>
          <div className="grid sm:grid-cols-3 gap-8">
            <Reveal delay={0}>
              <h3 className="font-display text-2xl mb-2">{content.value_1_title}</h3>
              <p className="text-sm text-[var(--bg)]/70 leading-relaxed">{content.value_1_text}</p>
            </Reveal>
            <Reveal delay={100}>
              <h3 className="font-display text-2xl mb-2">{content.value_2_title}</h3>
              <p className="text-sm text-[var(--bg)]/70 leading-relaxed">{content.value_2_text}</p>
            </Reveal>
            <Reveal delay={200}>
              <h3 className="font-display text-2xl mb-2">{content.value_3_title}</h3>
              <p className="text-sm text-[var(--bg)]/70 leading-relaxed">{content.value_3_text}</p>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryView({ category, products, loading, error, currency, onSelectProduct, onQuickAdd }) {
  const categoryProducts = category.slug === "all" ? products : products.filter((p) => p.category === category.slug);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">{category.label.toUpperCase()}</h1>

      {loading && (
        <div className="flex items-center gap-3 text-[var(--muted)] font-mono text-sm">
          <Loader2 size={18} className="animate-spin" /> Chargement des produits...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-sm p-5 text-sm">
          <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Impossible de charger les produits</p>
            <p className="text-[var(--muted)] font-mono text-xs">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && categoryProducts.length === 0 && (
        <p className="text-[var(--muted)] font-mono text-sm">
          {category.slug === "all" ? "Aucun produit disponible pour le moment." : "Aucun produit dans cette categorie pour le moment."}
        </p>
      )}

      {!loading && categoryProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
          {categoryProducts.map((product, idx) => (
            <Reveal key={product.id} delay={Math.min(idx, 8) * 60}>
              <ProductCard product={product} currency={currency} onSelect={() => onSelectProduct(product)} onQuickAdd={onQuickAdd} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function PrecommandeView({ products, loading, error, currency, onSelectProduct, onQuickAdd }) {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
      <p className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] mb-3">AVANT-PREMIERE</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-4">PRECOMMANDE</h1>
      <p className="max-w-lg text-[var(--muted)] text-sm mb-10">
        Ces pieces sont disponibles en avant-premiere. Selectionne ce qui t'interesse et laisse tes
        coordonnees : nous te recontacterons tres prochainement pour confirmer ta precommande.
      </p>

      {loading && (
        <div className="flex items-center gap-3 text-[var(--muted)] font-mono text-sm">
          <Loader2 size={18} className="animate-spin" /> Chargement...
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-sm p-5 text-sm">
          <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">Impossible de charger les produits</p>
            <p className="text-[var(--muted)] font-mono text-xs">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-[var(--muted)] font-mono text-sm">
          Aucun produit disponible en precommande pour le moment. Reviens bientot !
        </p>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              onSelect={() => onSelectProduct(product)}
              onQuickAdd={onQuickAdd}
              badge="PRECOMMANDE"
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AccordionItem({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--line)]">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-xs font-bold tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {label}
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line pb-4">{children}</p>
      )}
    </div>
  );
}

function ZoomOverlay({ images, index, onClose }) {
  const [activeIndex, setActiveIndex] = React.useState(index);
  const [scale, setScale] = React.useState(1);
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 });
  const [magnify, setMagnify] = React.useState({ active: false, x: 50, y: 50, box: { left: 0, top: 0, width: 0, height: 0 } });
  const scrollRef = React.useRef(null);
  const slideRef = React.useRef(null);
  const scaleRef = React.useRef(1);
  const gestureRef = React.useRef({});
  const lastTapRef = React.useRef({ time: 0, x: 0, y: 0 });
  const isHoverCapable = React.useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    []
  );

  React.useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el && el.clientWidth) el.scrollTo({ left: index * el.clientWidth, behavior: "auto" });
  }, []);

  React.useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function resetZoom() {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }

  function handleScroll() {
    if (scaleRef.current > 1) return;
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (prev !== idx ? idx : prev));
  }

  function goTo(idx) {
    resetZoom();
    const el = scrollRef.current;
    if (el && el.clientWidth) el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }

  function clampTranslate(t, s, rect) {
    const maxX = Math.max(0, (rect.width * (s - 1)) / 2);
    const maxY = Math.max(0, (rect.height * (s - 1)) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, t.x)), y: Math.max(-maxY, Math.min(maxY, t.y)) };
  }

  function toggleZoomAt(clientX, clientY) {
    const rect = slideRef.current.getBoundingClientRect();
    const tapX = clientX - rect.left;
    const tapY = clientY - rect.top;
    if (scaleRef.current > 1) {
      resetZoom();
    } else {
      const nextScale = 2.5;
      const offset = clampTranslate(
        { x: (rect.width / 2 - tapX) * (nextScale - 1), y: (rect.height / 2 - tapY) * (nextScale - 1) },
        nextScale,
        rect
      );
      setScale(nextScale);
      setTranslate(offset);
    }
  }

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function distance(touches) {
      const [a, b] = touches;
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        gestureRef.current.pinching = true;
        gestureRef.current.initialDistance = distance(e.touches);
        gestureRef.current.initialScale = scaleRef.current;
      } else if (e.touches.length === 1) {
        gestureRef.current.panX = e.touches[0].clientX;
        gestureRef.current.panY = e.touches[0].clientY;
        gestureRef.current.startX = e.touches[0].clientX;
        gestureRef.current.startY = e.touches[0].clientY;
        gestureRef.current.startTime = Date.now();
        gestureRef.current.moved = false;
      }
    }

    function onTouchMove(e) {
      if (e.touches.length === 2 && gestureRef.current.pinching) {
        e.preventDefault();
        const dist = distance(e.touches);
        const next = Math.min(
          4,
          Math.max(1, gestureRef.current.initialScale * (dist / gestureRef.current.initialDistance))
        );
        setScale(next);
        scaleRef.current = next;
        if (next <= 1) setTranslate({ x: 0, y: 0 });
      } else if (e.touches.length === 1 && scaleRef.current > 1) {
        e.preventDefault();
        gestureRef.current.moved = true;
        const dx = e.touches[0].clientX - gestureRef.current.panX;
        const dy = e.touches[0].clientY - gestureRef.current.panY;
        gestureRef.current.panX = e.touches[0].clientX;
        gestureRef.current.panY = e.touches[0].clientY;
        const rect = slideRef.current.getBoundingClientRect();
        setTranslate((t) => clampTranslate({ x: t.x + dx, y: t.y + dy }, scaleRef.current, rect));
      } else if (e.touches.length === 1) {
        const dx = Math.abs(e.touches[0].clientX - gestureRef.current.startX);
        const dy = Math.abs(e.touches[0].clientY - gestureRef.current.startY);
        if (dx > 10 || dy > 10) gestureRef.current.moved = true;
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length === 0) {
        const wasPinching = gestureRef.current.pinching;
        gestureRef.current.pinching = false;
        if (wasPinching) {
          if (scaleRef.current < 1.05) resetZoom();
          return;
        }
        const quickTap =
          !gestureRef.current.moved && Date.now() - (gestureRef.current.startTime || 0) < 250;
        if (quickTap && e.changedTouches.length) {
          const touch = e.changedTouches[0];
          const since = Date.now() - lastTapRef.current.time;
          const closeBy =
            Math.abs(touch.clientX - lastTapRef.current.x) < 30 &&
            Math.abs(touch.clientY - lastTapRef.current.y) < 30;
          if (since < 300 && closeBy) {
            toggleZoomAt(touch.clientX, touch.clientY);
            lastTapRef.current = { time: 0, x: 0, y: 0 };
          } else {
            lastTapRef.current = { time: Date.now(), x: touch.clientX, y: touch.clientY };
          }
        }
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex]);

  function handleMouseMove(e) {
    if (!isHoverCapable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagnify({
      active: true,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      box: { left: e.currentTarget.offsetLeft, top: e.currentTarget.offsetTop, width: rect.width, height: rect.height },
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo en grand"
      onClick={() => scale <= 1 && onClose()}
      className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center overscroll-contain"
    >
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-5 right-5 z-20 text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
      >
        <X size={26} />
      </button>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onClick={(e) => e.stopPropagation()}
        className={`w-full h-full flex no-scrollbar ${scale > 1 ? "overflow-hidden" : "overflow-x-auto snap-x snap-mandatory"}`}
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((img, idx) => (
          <div key={img} className="w-full h-full flex-shrink-0 snap-start flex items-center justify-center p-6">
            <div
              ref={idx === activeIndex ? slideRef : null}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={img}
                alt=""
                draggable={false}
                onMouseMove={idx === activeIndex ? handleMouseMove : undefined}
                onMouseLeave={() => setMagnify((m) => ({ ...m, active: false }))}
                className={`max-w-full max-h-full object-contain select-none ${
                  idx === activeIndex && isHoverCapable ? "cursor-zoom-in" : "cursor-default"
                }`}
                style={
                  idx === activeIndex
                    ? {
                        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                        transition: scale === 1 ? "transform 200ms ease-out" : "none",
                        touchAction: scale > 1 ? "none" : "auto",
                      }
                    : undefined
                }
              />
              {idx === activeIndex && isHoverCapable && magnify.active && scale === 1 && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: magnify.box.left,
                    top: magnify.box.top,
                    width: magnify.box.width,
                    height: magnify.box.height,
                    backgroundImage: `url(${img})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "230%",
                    backgroundPosition: `${magnify.x}% ${magnify.y}%`,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {images.length > 1 && scale === 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
              aria-label={`Photo ${idx + 1}`}
              className="p-1.5 -m-1.5 focus:outline-none"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductView({ product, selectedColor, setSelectedColor, selectedSize, setSelectedSize, selectedQty, setSelectedQty, onAdd, currency, mode = "shop", onZoom, content }) {
  const colorHex = product.colors.find((c) => c.name === selectedColor)?.hex || "#6F4E19";
  const isPreorder = mode === "preorder";
  const images = getProductImages(product);
  const [activeImage, setActiveImage] = useState(0);
  const imageScrollRef = React.useRef(null);

  function handleImageScroll() {
    const el = imageScrollRef.current;
    if (!el || !el.clientWidth) return;
    setActiveImage(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goToImage(idx) {
    const el = imageScrollRef.current;
    if (el && el.clientWidth) {
      el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
    }
  }

  const sizeEntries = getSizeEntries(product);
  const selectedSizeEntry = sizeEntries.find((s) => s.size === selectedSize);
  const maxQty = isPreorder
    ? 99
    : selectedSizeEntry && selectedSizeEntry.stock !== null
    ? selectedSizeEntry.stock
    : product.stock || 99;
  const outOfStock = !isPreorder && (sizeEntries.length > 0 ? maxQty <= 0 : product.stock <= 0);

  useEffect(() => {
    if (!isPreorder && maxQty > 0 && selectedQty > maxQty) setSelectedQty(maxQty);
  }, [selectedSize, maxQty]);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div
            className="group aspect-[4/5] rounded-sm relative overflow-hidden border border-[var(--line)]"
            style={{ backgroundColor: colorHex }}
          >
            {images.length > 0 ? (
              <>
                <div
                  ref={imageScrollRef}
                  onScroll={handleImageScroll}
                  className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
                  style={{ scrollbarWidth: "none" }}
                >
                  {images.map((img, idx) => (
                    <img
                      key={img}
                      src={img}
                      alt={product.name}
                      className="w-full h-full object-cover flex-shrink-0 snap-start animate-kenburns"
                    />
                  ))}
                </div>
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToImage(idx)}
                        aria-label={`Photo ${idx + 1}`}
                        className="p-1.5 -m-1.5 focus:outline-none"
                      >
                        <span
                          className={`block h-1.5 rounded-full transition-all duration-300 ${
                            idx === activeImage ? "w-5 bg-[var(--bg)]" : "w-1.5 bg-[var(--bg)]/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => onZoom(images, activeImage)}
                  aria-label="Agrandir la photo"
                  className="absolute left-3 bottom-3 z-10 w-9 h-9 rounded-full bg-[var(--bg)]/80 backdrop-blur-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <Search size={16} />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-end justify-center">
                <WaxPattern className="absolute inset-0 w-full h-full text-[#141110] animate-kenburns" opacity={0.15} />
                <div className="relative z-10 font-display text-[#141110]/80 text-3xl pb-8 tracking-wide">
                  TRAMSIRD
                </div>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => goToImage(idx)}
                  aria-label={`Photo ${idx + 1}`}
                  aria-current={activeImage === idx ? "true" : undefined}
                  className={`w-16 h-16 rounded-sm overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    activeImage === idx
                      ? "border-[var(--accent)] -translate-y-0.5 shadow-md"
                      : "border-[var(--line)] hover:border-[var(--line-strong)] hover:-translate-y-0.5"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl mb-2">{product.name}</h1>
          <p className="text-[var(--muted)] mb-4">{product.tagline}</p>
          <p className="font-mono text-2xl text-[var(--accent)] mb-6">{formatPrice(product.price, currency)}</p>

          <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">{product.description}</p>

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
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ease-out hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] ${
                      selectedColor === c.name ? "scale-110 shadow-md" : ""
                    }`}
                    style={{
                      backgroundColor: c.hex,
                      borderColor: selectedColor === c.name ? "var(--ink)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {sizeEntries.length > 0 && (
            <div className="mb-8">
              <p className="text-xs font-bold tracking-wide mb-3">
                TAILLE {selectedSize && <span className="text-[var(--muted)] font-normal">— {selectedSize}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizeEntries.map((s) => {
                  const sizeOut = !isPreorder && s.stock === 0;
                  return (
                    <button
                      key={s.size}
                      onClick={() => !sizeOut && setSelectedSize(s.size)}
                      disabled={sizeOut}
                      aria-pressed={selectedSize === s.size}
                      className={`w-12 h-12 rounded-sm font-mono text-sm border transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        sizeOut
                          ? "border-[var(--line)] text-[var(--muted)] line-through opacity-50 cursor-not-allowed"
                          : "hover:-translate-y-0.5 active:scale-90"
                      } ${
                        selectedSize === s.size && !sizeOut
                          ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] scale-105 shadow-md"
                          : !sizeOut
                          ? "border-[var(--line-strong)] text-[var(--ink)] hover:border-[var(--accent)]"
                          : ""
                      }`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-[var(--line-strong)] rounded-sm">
              <button
                onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                disabled={selectedQty <= 1}
                aria-label="Diminuer la quantite"
                className="p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40"
              >
                <Minus size={14} />
              </button>
              <span className="font-mono text-sm w-8 text-center">{selectedQty}</span>
              <button
                onClick={() => setSelectedQty(Math.min(maxQty || 99, selectedQty + 1))}
                disabled={!isPreorder && selectedQty >= maxQty}
                aria-label="Augmenter la quantite"
                className="p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
            {isPreorder && (
              <p className="font-mono text-[11px] text-[var(--muted)]">Disponible en precommande</p>
            )}
          </div>

          <button
            onClick={onAdd}
            disabled={outOfStock}
            className="w-full border-2 border-[var(--ink)] text-[var(--ink)] font-bold py-4 rounded-sm hover:bg-[var(--ink)] hover:text-[var(--bg)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-[var(--ink)]"
          >
            {isPreorder
              ? "AJOUTER A MA PRECOMMANDE"
              : !outOfStock
              ? `AJOUTER AU PANIER  •  ${formatPrice(product.price * selectedQty, currency)}`
              : "RUPTURE DE STOCK"}
          </button>

          <div className="mt-8">
            <AccordionItem label="TABLEAU DES TAILLES">{content.product_size_chart}</AccordionItem>
            <AccordionItem label="GUIDE DES TAILLES">{content.product_size_guide}</AccordionItem>
            <AccordionItem label="COMPOSITION">{content.product_material}</AccordionItem>
            <AccordionItem label="LIVRAISON">{content.product_delivery}</AccordionItem>
          </div>

          {content.product_shipping_note && (
            <div className="mt-10 flex flex-col items-center text-center gap-2">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Globe size={18} />
                <Truck size={18} />
              </div>
              <p className="font-mono text-[11px] tracking-wide">LIVRAISON</p>
              <p className="text-sm text-[var(--muted)]">{content.product_shipping_note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartView({
  cart, updateQty, onRemove, currency, cartTotal, onCheckout, onContinueShopping,
  title = "TON PANIER",
  emptyTitle = "TON PANIER EST VIDE",
  emptyText = "Ajoute un article pour commencer ta commande.",
  continueLabel = "Voir la collection",
  checkoutLabel = "Passer au paiement",
  showPromo = false,
  promoCodeInput, setPromoCodeInput, appliedPromo, onApplyPromo, onRemovePromo, promoError, promoChecking,
  discountAmount = 0,
}) {
  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-24 text-center">
        <ShoppingBag size={40} className="mx-auto mb-4 text-[var(--line-strong)]" />
        <h2 className="font-display text-2xl mb-2">{emptyTitle}</h2>
        <p className="text-[var(--muted)] mb-6 text-sm">{emptyText}</p>
        <button
          onClick={onContinueShopping}
          className="inline-flex bg-[var(--accent)] text-[var(--bg)] font-bold px-6 py-3 rounded-sm hover:bg-[var(--accent-dark)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)]"
        >
          {continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display text-2xl sm:text-3xl text-center mb-8">{title}</h1>

      <div className="mb-8">
        {cart.map((item, idx) => (
          <div key={idx} className="flex gap-4 py-5 border-b border-[var(--line)]">
            <div className="w-20 h-20 rounded-sm flex-shrink-0 bg-[var(--bg-soft)] overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-[var(--muted)]">
                  {item.color}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="font-mono text-xs text-[var(--muted)] mt-0.5">{item.size}</p>
                </div>
                <button
                  onClick={() => onRemove(idx)}
                  aria-label="Retirer l'article"
                  className="flex-shrink-0 p-1 text-[var(--muted)] hover:text-[var(--tag)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="font-mono text-sm mt-2">{formatPrice(item.price * item.qty, currency)}</p>
              <div className="flex items-center gap-3 border border-[var(--line-strong)] rounded-sm w-fit mt-3">
                <button onClick={() => updateQty(idx, -1)} className="p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label="Diminuer la quantite">
                  <Minus size={14} />
                </button>
                <span className="font-mono text-sm w-4 text-center">{item.qty}</span>
                <button onClick={() => updateQty(idx, 1)} className="p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label="Augmenter la quantite">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPromo && (
        <div className="border border-[var(--line)] rounded-sm p-4 mb-6">
          {appliedPromo ? (
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Code <span className="font-bold">{appliedPromo.code}</span> applique — <span className="text-[var(--accent)] font-bold">-{formatPrice(discountAmount, currency)}</span>
              </p>
              <button onClick={onRemovePromo} className="text-xs text-[var(--muted)] underline hover:text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm">
                Retirer
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--muted)] mb-2">CODE PROMO</p>
              <div className="flex gap-2">
                <input
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="Ex: BIENVENUE10"
                  disabled={promoChecking}
                  className="flex-1 bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-2 text-sm uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
                />
                <button
                  onClick={onApplyPromo}
                  disabled={promoChecking || !promoCodeInput.trim()}
                  className="bg-[var(--accent)] text-[var(--bg)] font-bold px-4 py-2 rounded-sm text-sm hover:bg-[var(--accent-dark)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)]"
                >
                  {promoChecking ? "..." : "Appliquer"}
                </button>
              </div>
              {promoError && <p className="text-xs text-[var(--tag)] mt-2">{promoError}</p>}
            </div>
          )}
        </div>
      )}

      <div className="mb-2">
        {discountAmount > 0 && (
          <div className="flex justify-between items-center mb-2">
            <p className="font-mono text-xs tracking-wide text-[var(--accent)]">REDUCTION</p>
            <p className="font-mono text-sm text-[var(--accent)]">-{formatPrice(discountAmount, currency)}</p>
          </div>
        )}
        <div className="flex justify-between items-center">
          <p className="font-mono text-xs font-bold tracking-wide">SOUS-TOTAL</p>
          <p className="font-mono text-sm font-bold">{formatPrice(Math.max(0, cartTotal - discountAmount), currency)}</p>
        </div>
      </div>
      <p className="text-xs italic text-[var(--muted)] mb-6">Frais de livraison et taxes calcules au paiement</p>

      <button
        onClick={onCheckout}
        className="w-full bg-[var(--ink)] text-[var(--bg)] font-bold py-4 rounded-sm tracking-wide hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {checkoutLabel.toUpperCase()}
      </button>
    </div>
  );
}

function CheckoutView({
  cart, currency, cartTotal, shipping, total,
  customer, setCustomer,
  paymentMethod, setPaymentMethod,
  submitting, error, onSubmit,
  appliedPromo, discountAmount = 0,
}) {
  const canSubmit =
    customer.name.trim().length > 1 &&
    customer.email.trim().includes("@") &&
    customer.phone.trim().length >= 8 &&
    customer.address.trim().length > 4;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">PAIEMENT</h1>

      <div className="border border-[var(--line)] rounded-sm p-5 mb-8 font-mono text-sm space-y-2">
        <div className="flex justify-between"><span className="text-[var(--muted)]">Articles ({cart.reduce((s, i) => s + i.qty, 0)})</span><span>{formatPrice(cartTotal, currency)}</span></div>
        {discountAmount > 0 && (
          <div className="flex justify-between"><span className="text-[var(--accent)]">Code {appliedPromo?.code}</span><span className="text-[var(--accent)]">-{formatPrice(discountAmount, currency)}</span></div>
        )}
        <div className="flex justify-between"><span className="text-[var(--muted)] flex items-center gap-1"><Truck size={13} /> Livraison</span><span>{formatPrice(shipping, currency)}</span></div>
        <div className="flex justify-between text-lg pt-2 border-t border-[var(--line)] mt-2"><span>Total</span><span className="text-[var(--accent)]">{formatPrice(total, currency)}</span></div>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-xs font-bold tracking-wide text-[var(--muted)]">TES COORDONNEES</p>
        <Field label="Nom complet">
          <input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
        <Field label="Telephone">
          <input
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            inputMode="tel"
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
        <Field label="Adresse de livraison">
          <input
            value={customer.address}
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
      </div>

      <div className="mb-8">
        <p className="text-xs font-bold tracking-wide text-[var(--muted)] mb-3">MODE DE PAIEMENT</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod("card")}
            disabled={submitting}
            aria-pressed={paymentMethod === "card"}
            className={`flex flex-col items-center gap-2 py-5 rounded-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 ${
              paymentMethod === "card" ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--line)] hover:border-[var(--line-strong)]"
            }`}
          >
            <CreditCard size={22} />
            <span className="text-xs sm:text-sm font-bold text-center">Carte bancaire</span>
          </button>
          <button
            onClick={() => setPaymentMethod("orange")}
            disabled={submitting}
            aria-pressed={paymentMethod === "orange"}
            className={`flex flex-col items-center gap-2 py-5 rounded-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 ${
              paymentMethod === "orange" ? "border-[#FF6600] bg-[#FF6600]/10" : "border-[var(--line)] hover:border-[var(--line-strong)]"
            }`}
          >
            <Smartphone size={22} className="text-[#FF6600]" />
            <span className="text-xs sm:text-sm font-bold text-center">Orange Money</span>
          </button>
        </div>
        <p className="text-[11px] text-[var(--muted)] font-mono mt-3">
          Tu confirmeras ton choix exact sur la page suivante.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-sm p-4 mb-6 text-sm">
          <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
          <p className="text-[var(--tag)]">{error}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-sm hover:bg-[var(--accent-dark)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Preparation du paiement...
          </>
        ) : (
          `Continuer vers le paiement - ${formatPrice(total, currency)}`
        )}
      </button>

      <p className="text-[11px] text-[var(--muted)] font-mono text-center mt-4">
        Paiement securise traite par CinetPay.
      </p>
    </div>
  );
}

function PreorderCheckoutView({ cart, currency, customer, setCustomer, submitting, error, onSubmit }) {
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const canSubmit =
    customer.name.trim().length > 1 &&
    customer.email.trim().includes("@") &&
    customer.phone.trim().length >= 8 &&
    customer.address.trim().length > 4;

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
      <h1 className="font-display text-3xl mb-2">TES COORDONNEES</h1>
      <p className="text-[var(--muted)] text-sm mb-8">
        Aucun paiement n'est demande maintenant. Nous te recontacterons pour confirmer ta precommande.
      </p>

      <div className="border border-[var(--line)] rounded-sm p-5 mb-8 font-mono text-sm space-y-2">
        {cart.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-[var(--muted)]">{item.name} - {item.color}, {item.size} x{item.qty}</span>
            <span>{formatPrice(item.price * item.qty, currency)}</span>
          </div>
        ))}
        <div className="flex justify-between text-lg pt-2 border-t border-[var(--line)] mt-2">
          <span>Total indicatif</span>
          <span className="text-[var(--accent)]">{formatPrice(cartTotal, currency)}</span>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <Field label="Nom complet">
          <input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
        <Field label="Telephone">
          <input
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            inputMode="tel"
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
        <Field label="Adresse de livraison">
          <input
            value={customer.address}
            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            disabled={submitting}
            className="w-full bg-transparent border border-[var(--line-strong)] rounded-sm px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
          />
        </Field>
      </div>

      {error && (
        <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-sm p-4 mb-6 text-sm">
          <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
          <p className="text-[var(--tag)]">{error}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-sm hover:bg-[var(--accent-dark)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Envoi en cours...
          </>
        ) : (
          "Confirmer ma precommande"
        )}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold tracking-wide mb-2 text-[var(--muted)]">{label}</label>
      {children}
    </div>
  );
}

function OrderStatusView({ orderId, isPaypal, cancelled, content, onBackHome }) {
  const [status, setStatus] = useState(cancelled ? "cancelled" : "checking");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cancelled || !orderId) return;
    let active = true;

    async function resolveStatus() {
      try {
        if (isPaypal) {
          const result = await capturePaypalOrder(orderId);
          if (!active) return;
          setStatus(result.status === "paid" ? "paid" : "failed");
          return;
        }

        for (let attempt = 0; attempt < 6; attempt++) {
          const result = await fetchPaymentStatus(orderId);
          if (!active) return;
          if (result.payment_status === "paid") {
            setStatus("paid");
            return;
          }
          if (result.payment_status === "failed") {
            setStatus("failed");
            return;
          }
          await new Promise((r) => setTimeout(r, 2500));
        }
        if (active) setStatus("pending");
      } catch (err) {
        if (active) {
          setError(err.message);
          setStatus("failed");
        }
      }
    }

    resolveStatus();
    return () => {
      active = false;
    };
  }, [orderId, isPaypal, cancelled]);

  if (status === "checking") {
    return (
      <div className="max-w-md mx-auto px-5 sm:px-8 py-28 text-center">
        <Loader2 size={32} className="animate-spin mx-auto mb-6 text-[var(--accent)]" />
        <h1 className="font-display text-2xl mb-3">VERIFICATION DU PAIEMENT...</h1>
        <p className="text-[var(--muted)] text-sm font-mono">Merci de patienter quelques secondes.</p>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="max-w-md mx-auto px-5 sm:px-8 py-28 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-soft)] flex items-center justify-center mx-auto mb-6">
          <XCircle size={30} />
        </div>
        <h1 className="font-display text-3xl mb-3">PAIEMENT ANNULE</h1>
        <p className="text-[var(--muted)] text-sm mb-8 font-mono">Ta commande n'a pas ete payee. Tu peux reessayer depuis ton panier.</p>
        <button
          onClick={onBackHome}
          className="inline-flex bg-[var(--accent)] text-[var(--bg)] font-bold px-6 py-3 rounded-sm hover:bg-[var(--accent-dark)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)]"
        >
          Retour a l'accueil
        </button>
      </div>
    );
  }

  if (status === "paid") {
    return <SuccessView content={content} onBackHome={onBackHome} />;
  }

  return (
    <div className="max-w-md mx-auto px-5 sm:px-8 py-28 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--tag)]/20 flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={30} className="text-[var(--tag)]" />
      </div>
      <h1 className="font-display text-3xl mb-3">{status === "pending" ? "PAIEMENT EN ATTENTE" : "PAIEMENT NON CONFIRME"}</h1>
      <p className="text-[var(--muted)] text-sm mb-2 font-mono">
        {status === "pending"
          ? "Le paiement est encore en cours de traitement. Verifie ton e-mail dans quelques minutes."
          : "Le paiement n'a pas pu etre confirme. Contacte-nous si le montant a ete debite."}
      </p>
      {error && <p className="text-[var(--tag)] text-xs mb-6 font-mono">{error}</p>}
      <button
        onClick={onBackHome}
        className="inline-flex bg-[var(--accent)] text-[var(--bg)] font-bold px-6 py-3 rounded-sm hover:bg-[var(--accent-dark)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)] mt-4"
      >
        Retour a l'accueil
      </button>
    </div>
  );
}

function SuccessView({ content, onBackHome }) {
  return (
    <div className="max-w-md mx-auto px-5 sm:px-8 py-28 text-center">
      <div className="w-16 h-16 rounded-full bg-[#2F5233] flex items-center justify-center mx-auto mb-6">
        <Check size={30} className="text-[var(--bg)]" />
      </div>
      <h1 className="font-display text-3xl mb-3">{content.success_title}</h1>
      <p className="text-[var(--muted)] text-sm mb-8 font-mono">
        {content.success_text}
      </p>
      <button
        onClick={onBackHome}
        className="inline-flex bg-[var(--accent)] text-[var(--bg)] font-bold px-6 py-3 rounded-sm hover:bg-[var(--accent-dark)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg)]"
      >
        Retour a l'accueil
      </button>
    </div>
  );
}

function AboutView({ content }) {
  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
      <h1 className="font-display text-3xl mb-6">{content.about_heading}</h1>
      <p className="text-[var(--muted)] text-base leading-relaxed whitespace-pre-line">{content.about_text}</p>
    </div>
  );
}

const ORDER_STATUS_LABELS = {
  new: "Nouvelle",
  processing: "En preparation",
  shipped: "Expediee",
  delivered: "Livree",
  cancelled: "Annulee",
};

const ORDER_STATUS_COLORS = {
  new: "var(--accent)",
  processing: "#B8860B",
  shipped: "var(--accent-dark)",
  delivered: "#4ADE80",
  cancelled: "var(--tag)",
};

function DarkField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-[0.15em] mb-2 text-[var(--muted)]">{label}</label>
      {children}
    </div>
  );
}

const darkInputClass =
  "w-full bg-white/50 border border-[var(--line-strong)] rounded-lg px-4 py-3 text-sm text-[var(--ink)] placeholder-[var(--muted)]/60 transition-all duration-200 focus:outline-none focus:border-[var(--accent)] focus:bg-white/80 focus:shadow-[0_0_0_4px_rgba(111,78,25,0.12)] disabled:opacity-50";

function PasswordInput({ value, onChange, disabled, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="current-password"
        className={`${darkInputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors focus:outline-none"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function AccountView({
  account, accountLoading, accountOrders,
  accountMode, setAccountMode, accountForm, setAccountForm,
  accountSubmitting, accountError, onSubmit, onLogout, currency,
}) {
  const isLogin = accountMode === "login";
  const isForgot = accountMode === "forgot";
  const canSubmit = isLogin
    ? accountForm.identifier.trim().length > 3 && accountForm.password.length >= 8
    : accountForm.name.trim().length > 1 &&
      (accountForm.email.trim().includes("@") || accountForm.phone.trim().length > 3) &&
      accountForm.password.length >= 8;

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleForgotSubmit() {
    setForgotSubmitting(true);
    setForgotError(null);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotSubmitting(false);
    }
  }

  const initials = account
    ? account.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "";

  const totalSpent = accountOrders.reduce((s, o) => s + (o.payment_status === "paid" ? o.total : 0), 0);

  return (
    <div className="relative overflow-hidden">
      {/* Fond aurora anime */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[34rem] h-[34rem] rounded-full bg-[var(--tag)]/15 blur-[110px] animate-aurora-1"
          style={{ top: "-14%", left: "-12%" }}
        />
        <div
          className="absolute w-[28rem] h-[28rem] rounded-full bg-[var(--accent-dark)]/20 blur-[100px] animate-aurora-2"
          style={{ bottom: "-16%", right: "-8%" }}
        />
        <div
          className="absolute w-[22rem] h-[22rem] rounded-full bg-[var(--accent)]/20 blur-[90px] animate-aurora-3"
          style={{ top: "35%", right: "12%" }}
        />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(28,23,18,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(28,23,18,0.05) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "radial-gradient(circle at 50% 20%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 20%, black, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-md mx-auto px-5 sm:px-8 py-16">
        {accountLoading ? (
          <div className="py-24 text-center">
            <Loader2 size={28} className="animate-spin mx-auto text-[var(--accent)]" />
          </div>
        ) : !account ? (
          <div className="backdrop-blur-xl bg-white/50 border border-[var(--line)] rounded-2xl p-7 sm:p-8 shadow-[0_20px_60px_rgba(111,78,25,0.1)]">
            <div className="flex flex-col items-center mb-7 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--tag)] flex items-center justify-center mb-4 shadow-[0_0_35px_rgba(111,78,25,0.3)]">
                {isForgot ? (
                  <Mail size={22} className="text-[var(--bg)]" strokeWidth={2} />
                ) : (
                  <User size={24} className="text-[var(--bg)]" strokeWidth={2} />
                )}
              </div>
              <h1 className="font-display text-2xl text-[var(--ink)]">
                {isForgot ? "MOT DE PASSE OUBLIE" : isLogin ? "CONTENT DE TE REVOIR" : "REJOINS TRAMSIRD"}
              </h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                {isForgot
                  ? "On t'envoie un lien de reinitialisation"
                  : isLogin
                  ? "Connecte-toi a ton compte"
                  : "Cree ton compte en quelques secondes"}
              </p>
            </div>

            {!isForgot && (
              <div className="relative grid grid-cols-2 mb-7 bg-[var(--bg-soft)] rounded-full p-1 border border-[var(--line)]">
                <div
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--tag)] transition-transform duration-300 ease-out"
                  style={{ transform: isLogin ? "translateX(0%)" : "translateX(100%)" }}
                />
                <button
                  onClick={() => setAccountMode("login")}
                  className={`relative z-10 py-2 text-xs font-bold tracking-wide rounded-full transition-colors duration-300 ${
                    isLogin ? "text-[var(--bg)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  CONNEXION
                </button>
                <button
                  onClick={() => setAccountMode("register")}
                  className={`relative z-10 py-2 text-xs font-bold tracking-wide rounded-full transition-colors duration-300 ${
                    !isLogin ? "text-[var(--bg)]" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  INSCRIPTION
                </button>
              </div>
            )}

            {isForgot ? (
              <div key="forgot" className="space-y-4 animate-fade-in-up">
                {forgotSent ? (
                  <div className="flex items-start gap-3 border border-[#2F5233]/30 bg-[#2F5233]/10 rounded-lg p-4 text-sm">
                    <Check size={18} className="text-[#2F5233] flex-shrink-0 mt-0.5" />
                    <p className="text-[#2F5233]">Si un compte existe avec cet e-mail, un lien de reinitialisation vient d'etre envoye. Verifie ta boite de reception.</p>
                  </div>
                ) : (
                  <>
                    <DarkField label="E-MAIL">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotSubmitting}
                        className={darkInputClass}
                      />
                    </DarkField>
                    {forgotError && (
                      <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-lg p-4 text-sm">
                        <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
                        <p className="text-[var(--tag)]">{forgotError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleForgotSubmit}
                      disabled={!forgotEmail.trim().includes("@") || forgotSubmitting}
                      className="group relative w-full overflow-hidden bg-gradient-to-r from-[var(--accent)] to-[var(--tag)] text-[var(--bg)] font-bold py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {forgotSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Envoyer le lien"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setAccountMode("login");
                    setForgotSent(false);
                    setForgotError(null);
                  }}
                  className="w-full text-center text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors pt-1"
                >
                  Retour a la connexion
                </button>
              </div>
            ) : (
              <div key={accountMode} className="space-y-4 animate-fade-in-up">
                {!isLogin && (
                  <DarkField label="NOM COMPLET">
                    <input
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      disabled={accountSubmitting}
                      className={darkInputClass}
                    />
                  </DarkField>
                )}
                {isLogin ? (
                  <DarkField label="E-MAIL OU TELEPHONE">
                    <input
                      value={accountForm.identifier}
                      onChange={(e) => setAccountForm({ ...accountForm, identifier: e.target.value })}
                      disabled={accountSubmitting}
                      className={darkInputClass}
                    />
                  </DarkField>
                ) : (
                  <>
                    <DarkField label="E-MAIL">
                      <input
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                        disabled={accountSubmitting}
                        className={darkInputClass}
                      />
                    </DarkField>
                    <DarkField label="TELEPHONE">
                      <input
                        value={accountForm.phone}
                        onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                        disabled={accountSubmitting}
                        className={`${darkInputClass} font-mono`}
                      />
                    </DarkField>
                    <p className="text-xs text-[var(--muted)] -mt-2">Renseigne au moins l'un des deux (email ou telephone).</p>
                  </>
                )}
                <DarkField label="MOT DE PASSE (8 CARACTERES MIN.)">
                  <PasswordInput
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    disabled={accountSubmitting}
                  />
                </DarkField>
                {isLogin && (
                  <button
                    onClick={() => setAccountMode("forgot")}
                    className="block text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors -mt-2"
                  >
                    Mot de passe oublie ?
                  </button>
                )}
                {!isLogin && (
                  <DarkField label="ADRESSE (OPTIONNEL)">
                    <input
                      value={accountForm.address}
                      onChange={(e) => setAccountForm({ ...accountForm, address: e.target.value })}
                      disabled={accountSubmitting}
                      className={darkInputClass}
                    />
                  </DarkField>
                )}

                {accountError && (
                  <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-lg p-4 text-sm">
                    <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[var(--tag)]">{accountError}</p>
                      {!isLogin && accountError.includes("existe deja") && (
                        <button
                          onClick={() => setAccountMode("login")}
                          className="text-[var(--tag)] underline underline-offset-2 font-bold mt-1"
                        >
                          Se connecter a la place
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={onSubmit}
                  disabled={!canSubmit || accountSubmitting}
                  className="group relative w-full overflow-hidden bg-gradient-to-r from-[var(--accent)] to-[var(--tag)] text-[var(--bg)] font-bold py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
                  <span className="relative z-10 flex items-center gap-2">
                    {accountSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isLogin ? (
                      "Se connecter"
                    ) : (
                      "Creer mon compte"
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="backdrop-blur-xl bg-white/50 border border-[var(--line)] rounded-2xl p-7 sm:p-8 shadow-[0_20px_60px_rgba(111,78,25,0.1)] mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--tag)] flex items-center justify-center font-display text-lg text-[var(--bg)] shadow-[0_0_35px_rgba(111,78,25,0.3)] flex-shrink-0">
                    {initials}
                  </div>
                  <div>
                    <h1 className="font-display text-xl text-[var(--ink)]">{account.name}</h1>
                    <p className="text-[var(--muted)] text-sm">{account.email || account.phone}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  aria-label="Deconnexion"
                  className="p-2.5 rounded-full border border-[var(--line)] text-[var(--muted)] hover:text-[var(--tag)] hover:border-[var(--tag)]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <LogOut size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 border border-[var(--line)] rounded-lg p-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[var(--muted)] mb-1">COMMANDES</p>
                  <p className="font-display text-2xl text-[var(--ink)]">{accountOrders.length}</p>
                </div>
                <div className="bg-white/50 border border-[var(--line)] rounded-lg p-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[var(--muted)] mb-1">TOTAL DEPENSE</p>
                  <p className="font-display text-2xl text-[var(--ink)]">{formatPrice(totalSpent, currency)}</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-bold tracking-[0.15em] text-[var(--muted)] mb-3 px-1">HISTORIQUE DES COMMANDES</p>
            {accountOrders.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/50 border border-[var(--line)] rounded-2xl p-8 text-center">
                <Package size={26} className="mx-auto mb-3 text-[var(--line-strong)]" />
                <p className="text-sm text-[var(--muted)]">Tu n'as pas encore de commande.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accountOrders.map((o, idx) => (
                  <div
                    key={o.id}
                    className="backdrop-blur-xl bg-white/50 border border-[var(--line)] rounded-xl p-4 hover:border-[var(--line-strong)] transition-colors duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-mono text-xs text-[var(--muted)]">
                        {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <span
                        className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full"
                        style={{
                          color: ORDER_STATUS_COLORS[o.status] || "var(--ink)",
                          backgroundColor: `color-mix(in srgb, ${ORDER_STATUS_COLORS[o.status] || "#000"} 18%, transparent)`,
                        }}
                      >
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-[var(--muted)]">{o.items.reduce((s, i) => s + i.qty, 0)} article(s)</p>
                      <p className="font-mono text-sm text-[var(--ink)]">{formatPrice(o.total, currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResetPasswordView({ customerId, token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = password.length >= 8 && password === confirm;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword({ customerId, token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden min-h-[70vh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[34rem] h-[34rem] rounded-full bg-[var(--tag)]/15 blur-[110px] animate-aurora-1" style={{ top: "-14%", left: "-12%" }} />
        <div className="absolute w-[28rem] h-[28rem] rounded-full bg-[var(--accent-dark)]/20 blur-[100px] animate-aurora-2" style={{ bottom: "-16%", right: "-8%" }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 sm:px-8 py-16">
        <div className="backdrop-blur-xl bg-white/50 border border-[var(--line)] rounded-2xl p-7 sm:p-8 shadow-[0_20px_60px_rgba(111,78,25,0.1)]">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#2F5233]/15 flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-[#2F5233]" />
              </div>
              <h1 className="font-display text-2xl text-[var(--ink)] mb-2">MOT DE PASSE MODIFIE</h1>
              <p className="text-[var(--muted)] text-sm mb-6">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
              <button
                onClick={onDone}
                className="inline-flex bg-gradient-to-r from-[var(--accent)] to-[var(--tag)] text-[var(--bg)] font-bold px-6 py-3 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-7 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--tag)] flex items-center justify-center mb-4 shadow-[0_0_35px_rgba(111,78,25,0.3)]">
                  <User size={24} className="text-[var(--bg)]" strokeWidth={2} />
                </div>
                <h1 className="font-display text-2xl text-[var(--ink)]">NOUVEAU MOT DE PASSE</h1>
                <p className="text-[var(--muted)] text-sm mt-1">Choisis un mot de passe d'au moins 8 caracteres</p>
              </div>
              <div className="space-y-4">
                <DarkField label="NOUVEAU MOT DE PASSE">
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} />
                </DarkField>
                <DarkField label="CONFIRMER LE MOT DE PASSE">
                  <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={submitting} />
                </DarkField>
                {error && (
                  <div className="flex items-start gap-3 border border-[var(--tag)]/40 bg-[var(--tag)]/10 rounded-lg p-4 text-sm">
                    <AlertCircle size={18} className="text-[var(--tag)] flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--tag)]">{error}</p>
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--tag)] text-[var(--bg)] font-bold py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : "Reinitialiser le mot de passe"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer({ content, onNavigateAbout }) {
  const hasInstagram = content.social_instagram && content.social_instagram.trim().length > 0;
  const hasTiktok = content.social_tiktok && content.social_tiktok.trim().length > 0;

  return (
    <footer className="relative z-10 border-t border-[var(--line)] pt-20 bg-[var(--bg-soft)]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid sm:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-2xl mb-3">TRAMSIRD</p>
          <p className="font-mono text-xs text-[var(--muted)] tracking-wide mb-4">{content.slogan_signature}</p>
          <div className="flex items-center gap-4">
            {hasInstagram && (
              <a
                href={content.social_instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
              >
                <Instagram size={18} />
              </a>
            )}
            {hasTiktok && (
              <a
                href={content.social_tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
              >
                <TikTokIcon size={18} />
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs font-bold tracking-wide text-[var(--ink)] mb-4">MARQUE</p>
          <nav className="flex flex-col gap-3">
            <button
              onClick={onNavigateAbout}
              className="text-left text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm w-fit"
            >
              Notre histoire
            </button>
          </nav>
        </div>

        <div>
          <p className="font-mono text-xs font-bold tracking-wide text-[var(--ink)] mb-4">PAIEMENT & LIVRAISON</p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{content.feature_2_text}</p>
          <p className="text-sm text-[var(--muted)] leading-relaxed mt-2">{content.feature_3_text}</p>
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row justify-between gap-2 items-center">
          <p className="text-xs text-[var(--muted)] font-mono">{content.footer_text}</p>
          <p className="text-xs text-[var(--muted)] font-mono">{content.slogan_signature}</p>
        </div>
      </div>
    </footer>
  );
}
