import "server-only";
import crypto from "node:crypto";
import type { ChargeRequest, ChargeResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Paiement par QR Code : ne débite rien lui-même. Il génère un jeton
 * sécurisé menant vers une page de paiement (`/pay/[orderId]/[token]`) où
 * le client choisit un moyen de paiement réel (Orange Money, MTN MoMo,
 * carte). Le paiement reste `PENDING` tant qu'aucune de ces méthodes n'a
 * été confirmée par son fournisseur.
 */
export class QrCodeProvider implements PaymentProvider {
  readonly key = "qr-code";

  isConfigured() {
    return true;
  }

  async initiate(request: ChargeRequest): Promise<ChargeResult> {
    const token = crypto.randomBytes(24).toString("hex");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      status: "PENDING",
      providerReference: token,
      message: "Scannez le QR Code pour finaliser le paiement.",
      redirectUrl: `${appUrl}/pay/${request.orderId}/${token}`,
    };
  }
}
