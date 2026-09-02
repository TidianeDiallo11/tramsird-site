import "server-only";
import type { ChargeRequest, ChargeResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Paiement en espèces. Contrairement au Mobile Money, il n'y a pas d'API
 * externe à interroger : le paiement reste `PENDING` jusqu'à ce qu'un
 * membre du personnel confirme explicitement avoir reçu l'argent (voir
 * `confirmCashPayment` dans payment-service.ts). Ce n'est pas une
 * simulation — c'est la même vérification humaine qu'en caisse physique.
 */
export class CashProvider implements PaymentProvider {
  readonly key = "cash";

  isConfigured() {
    return true;
  }

  async initiate(_request: ChargeRequest): Promise<ChargeResult> {
    return {
      status: "PENDING",
      message: "En attente de la remise des espèces (à confirmer par un membre du personnel).",
    };
  }
}
