import "server-only";
import type { ChargeRequest, ChargeResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Intégration MTN Mobile Money (MoMo Collections API).
 *
 * Comme pour Orange Money, aucune transaction n'est jamais marquée comme
 * réussie sans confirmation réelle du serveur MTN via webhook. Sans clés
 * MTN_MOMO_* valides, le paiement est simplement refusé.
 */
export class MtnMomoProvider implements PaymentProvider {
  readonly key = "mtn-momo";

  isConfigured() {
    return Boolean(
      process.env.MTN_MOMO_API_BASE_URL &&
        process.env.MTN_MOMO_SUBSCRIPTION_KEY &&
        process.env.MTN_MOMO_API_USER &&
        process.env.MTN_MOMO_API_KEY,
    );
  }

  async initiate(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.isConfigured()) {
      return {
        status: "FAILED",
        message:
          "MTN Mobile Money n'est pas encore configuré. Renseignez MTN_MOMO_API_BASE_URL, " +
          "MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER et MTN_MOMO_API_KEY pour activer ce moyen de paiement.",
      };
    }

    if (!request.customerPhone) {
      return { status: "FAILED", message: "Numéro de téléphone Mobile Money requis." };
    }

    // Exemple d'intégration réelle (MoMo Collections "requesttopay") :
    //
    // const referenceId = crypto.randomUUID();
    // await fetch(`${process.env.MTN_MOMO_API_BASE_URL}/collection/v1_0/requesttopay`, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //     "X-Reference-Id": referenceId,
    //     "X-Target-Environment": process.env.MTN_MOMO_TARGET_ENVIRONMENT ?? "sandbox",
    //     "Ocp-Apim-Subscription-Key": process.env.MTN_MOMO_SUBSCRIPTION_KEY!,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     amount: String(request.amount),
    //     currency: "GNF",
    //     externalId: request.orderNumber,
    //     payer: { partyIdType: "MSISDN", partyId: request.customerPhone },
    //     payerMessage: `Commande ${request.orderNumber}`,
    //     payeeNote: "ShopFlow",
    //     callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payments/mtn-momo`,
    //   }),
    // });
    // return { status: "PROCESSING", providerReference: referenceId };

    return {
      status: "FAILED",
      message: "Intégration MTN Mobile Money non implémentée pour cet environnement.",
    };
  }
}
