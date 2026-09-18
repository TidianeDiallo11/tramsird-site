import "server-only";
import crypto from "node:crypto";
import type { PaymentMethod } from "@/generated/prisma/enums";
import type { ChargeRequest, ChargeResult, PaymentProvider } from "@/lib/payments/types";

/**
 * Intégration Djomy (agrégateur de paiement guinéen : Orange Money, MTN MoMo,
 * carte bancaire, KULU...) — https://developers.djomy.africa/
 *
 * Ce provider ne simule JAMAIS une transaction réussie : tant que les
 * identifiants (DJOMY_*) ne sont pas fournis en variables d'environnement,
 * toute tentative de paiement est refusée côté serveur. Une fois les clés
 * renseignées, `initiate` obtient un token d'accès puis appelle l'API réelle
 * de paiement avec redirection (`/v1/payments/gateway`), qui couvre tous les
 * moyens de paiement Djomy (y compris carte). La confirmation finale arrive
 * toujours de façon asynchrone via le webhook `/api/webhooks/payments/djomy`.
 *
 * ⚠️ Les noms exacts de certains champs de réponse (token d'accès, URL de
 * redirection) n'étaient pas visibles dans la documentation fournie au moment
 * de l'écriture — ils sont couverts par plusieurs alias probables ci-dessous,
 * à confirmer/ajuster dès le premier appel réel en sandbox.
 */
export class DjomyProvider implements PaymentProvider {
  readonly key = "djomy";

  isConfigured() {
    return Boolean(
      process.env.DJOMY_API_BASE_URL && process.env.DJOMY_CLIENT_ID && process.env.DJOMY_CLIENT_SECRET,
    );
  }

  private buildApiKeyHeader(clientId: string, clientSecret: string) {
    // Doc Djomy : signature = HMAC-SHA256(message: clientId, clé: clientSecret), en hexadécimal.
    const signature = crypto.createHmac("sha256", clientSecret).update(clientId).digest("hex");
    return `${clientId}:${signature}`;
  }

  private async getAccessToken(baseUrl: string, apiKey: string): Promise<string> {
    const res = await fetch(`${baseUrl}/v1/auth`, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(body?.error?.message ?? body?.message ?? `Djomy: authentification refusée (${res.status}).`);
    }
    const data = body?.data ?? body;
    const token = data?.accessToken ?? data?.access_token ?? data?.token;
    if (!token) throw new Error("Djomy: jeton d'accès absent de la réponse d'authentification.");
    return token;
  }

  private methodToDjomy(method: PaymentMethod): string | null {
    switch (method) {
      case "ORANGE_MONEY":
        return "OM";
      case "MTN_MOMO":
      case "OTHER_MOMO":
        return "MOMO";
      case "CARD":
        return "CARD";
      default:
        return null;
    }
  }

  async initiate(request: ChargeRequest): Promise<ChargeResult> {
    if (!this.isConfigured()) {
      return {
        status: "FAILED",
        message:
          "Djomy n'est pas encore configuré. Renseignez DJOMY_API_BASE_URL, DJOMY_CLIENT_ID et " +
          "DJOMY_CLIENT_SECRET dans les variables d'environnement pour activer ce moyen de paiement.",
      };
    }

    const djomyMethod = this.methodToDjomy(request.method);
    if (!djomyMethod) {
      return { status: "FAILED", message: "Ce moyen de paiement n'est pas géré par l'intégration Djomy." };
    }

    const baseUrl = process.env.DJOMY_API_BASE_URL!;
    const clientId = process.env.DJOMY_CLIENT_ID!;
    const clientSecret = process.env.DJOMY_CLIENT_SECRET!;
    const countryCode = process.env.DJOMY_COUNTRY_CODE ?? "GN";
    const apiKey = this.buildApiKeyHeader(clientId, clientSecret);

    try {
      const token = await this.getAccessToken(baseUrl, apiKey);

      const res = await fetch(`${baseUrl}/v1/payments/gateway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          amount: request.amount,
          countryCode,
          payerNumber: request.customerPhone ?? undefined,
          allowedPaymentMethods: [djomyMethod],
          description: `Commande ${request.orderNumber}`,
          // Notre id de paiement interne : permet au webhook de retrouver la
          // ligne Payment sans dépendre de l'identifiant Djomy.
          merchantPaymentReference: request.paymentId,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${request.orderId}/callback`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${request.orderId}/callback?cancelled=1`,
        }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          status: "FAILED",
          message: body?.error?.message ?? body?.message ?? `Djomy a refusé la demande de paiement (${res.status}).`,
          raw: body,
        };
      }

      const data = body?.data ?? body;
      const redirectUrl = data?.redirectUrl ?? data?.paymentUrl ?? data?.url;
      const transactionId = data?.transactionId ?? data?.id;

      return {
        status: "PROCESSING",
        providerReference: transactionId,
        redirectUrl,
        message: "Paiement initié — redirection vers Djomy pour finalisation.",
        raw: body,
      };
    } catch (err) {
      return {
        status: "FAILED",
        message: err instanceof Error ? err.message : "Erreur lors de l'appel à l'API Djomy.",
      };
    }
  }
}
