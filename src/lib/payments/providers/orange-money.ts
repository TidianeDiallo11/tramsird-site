import "server-only";
import type { ChargeRequest, ChargeResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Intégration Orange Money (Guinée) — API "Orange Money Web Payment".
 *
 * Ce provider ne simule JAMAIS une transaction réussie : tant que les
 * identifiants officiels (ORANGE_MONEY_*) ne sont pas fournis en variables
 * d'environnement, toute tentative de paiement est refusée côté serveur.
 * Une fois les clés renseignées, `initiate` doit appeler l'API réelle
 * d'Orange (webpay/psp) puis attendre la confirmation asynchrone via le
 * webhook `/api/webhooks/payments/orange-money` avant de considérer le
 * paiement comme réussi.
 */
export class OrangeMoneyProvider implements PaymentProvider {
  readonly key = "orange-money";

  isConfigured() {
    return Boolean(
      process.env.ORANGE_MONEY_API_BASE_URL &&
        process.env.ORANGE_MONEY_CLIENT_ID &&
        process.env.ORANGE_MONEY_CLIENT_SECRET &&
        process.env.ORANGE_MONEY_MERCHANT_KEY,
    );
  }

  async initiate(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.isConfigured()) {
      return {
        status: "FAILED",
        message:
          "Orange Money n'est pas encore configuré. Renseignez ORANGE_MONEY_API_BASE_URL, " +
          "ORANGE_MONEY_CLIENT_ID, ORANGE_MONEY_CLIENT_SECRET et ORANGE_MONEY_MERCHANT_KEY " +
          "dans les variables d'environnement pour activer ce moyen de paiement.",
      };
    }

    // Exemple d'intégration réelle (à adapter selon le contrat Orange) :
    //
    // const token = await fetch(`${process.env.ORANGE_MONEY_API_BASE_URL}/oauth/token`, {
    //   method: "POST",
    //   headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
    //   body: "grant_type=client_credentials",
    // }).then((r) => r.json());
    //
    // const payment = await fetch(`${process.env.ORANGE_MONEY_API_BASE_URL}/webpayment`, {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
    //     amount: request.amount,
    //     currency: "GNF",
    //     order_id: request.orderNumber,
    //     return_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${request.orderId}/callback`,
    //     cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${request.orderId}/callback?cancelled=1`,
    //     notif_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payments/orange-money`,
    //   }),
    // }).then((r) => r.json());
    //
    // return { status: "PROCESSING", providerReference: payment.pay_token, redirectUrl: payment.payment_url, raw: payment };

    return {
      status: "FAILED",
      message: "Intégration Orange Money non implémentée pour cet environnement.",
    };
  }
}
