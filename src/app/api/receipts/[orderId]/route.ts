import { prisma } from "@/lib/prisma";
import { getStaffSession, getCustomerSession } from "@/lib/session";
import { formatGNF, formatDateTime } from "@/lib/utils";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const [staffSession, customerSession] = await Promise.all([getStaffSession(), getCustomerSession()]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      customer: true,
      employee: true,
    },
  });

  const authorized = staffSession || (customerSession && order?.customerId === customerSession.sub);
  if (!order || !authorized) {
    return new Response("Reçu introuvable", { status: 404 });
  }

  const settings = await prisma.storeSettings.findFirst();
  const payment = order.payments[0];

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Reçu ${escapeHtml(order.orderNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, "SF Mono", Menlo, monospace; max-width: 380px; margin: 24px auto; color: #111; font-size: 13px; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 2px; }
  .center { text-align: center; }
  .muted { color: #666; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; vertical-align: top; }
  .total { font-size: 15px; font-weight: bold; }
  .btns { max-width: 380px; margin: 0 auto 16px; display: flex; gap: 8px; }
  button { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #ccc; background: #f5f5f5; font: inherit; cursor: pointer; }
  @media print { .btns { display: none; } body { margin: 0 auto; } }
</style>
</head>
<body>
  <div class="btns">
    <button onclick="window.print()">Imprimer / Télécharger en PDF</button>
  </div>
  <h1>${escapeHtml(settings?.name ?? "ShopFlow")}</h1>
  <p class="center muted">${escapeHtml(settings?.address ?? "")}<br/>${escapeHtml(settings?.phone ?? "")}</p>
  <hr/>
  <div class="row"><span>Commande</span><strong>${escapeHtml(order.orderNumber)}</strong></div>
  <div class="row"><span>Date</span><span>${formatDateTime(order.createdAt)}</span></div>
  ${order.customer ? `<div class="row"><span>Client</span><span>${escapeHtml(order.customer.name)}</span></div>` : ""}
  ${order.employee ? `<div class="row"><span>Vendeur</span><span>${escapeHtml(order.employee.name)}</span></div>` : ""}
  <hr/>
  <table>
    ${order.items
      .map(
        (item) => `<tr>
      <td>${item.quantity}× ${escapeHtml(item.nameSnapshot)}</td>
      <td style="text-align:right; white-space:nowrap;">${formatGNF(item.subtotal)}</td>
    </tr>`,
      )
      .join("")}
  </table>
  <hr/>
  <div class="row"><span>Sous-total</span><span>${formatGNF(order.subtotal)}</span></div>
  <div class="row"><span>Remise</span><span>-${formatGNF(order.discount)}</span></div>
  <div class="row"><span>Livraison</span><span>${formatGNF(order.deliveryFee)}</span></div>
  <div class="row total"><span>Total</span><span>${formatGNF(order.total)}</span></div>
  <hr/>
  <div class="row"><span>Paiement</span><span>${payment ? escapeHtml(payment.method.replace("_", " ")) : "—"}</span></div>
  <div class="row"><span>Statut</span><span>${payment ? escapeHtml(payment.status) : "—"}</span></div>
  <hr/>
  <p class="center muted">Merci pour votre confiance !</p>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
