import "server-only";
import type { ChargeRequest, ChargeResult, PaymentProvider } from "@/lib/payments/types";

export class CardProvider implements PaymentProvider {
  readonly key = "card";

  isConfigured() {
    return Boolean(process.env.CARD_PSP_API_KEY);
  }

  async initiate(_request: ChargeRequest): Promise<ChargeResult> {
    if (!this.isConfigured()) {
      return {
        status: "FAILED",
        message:
          "Le paiement par carte bancaire n'est pas encore configuré. Renseignez CARD_PSP_API_KEY " +
          "avec les identifiants de votre prestataire (PSP) pour l'activer.",
      };
    }
    return { status: "FAILED", message: "Intégration carte bancaire non implémentée pour cet environnement." };
  }
}
