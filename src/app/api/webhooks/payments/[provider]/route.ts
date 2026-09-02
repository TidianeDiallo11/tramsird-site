import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/payments/payment-service";

const WEBHOOK_SECRETS: Record<string, string | undefined> = {
  "orange-money": process.env.ORANGE_MONEY_WEBHOOK_SECRET,
  "mtn-momo": process.env.MTN_MOMO_WEBHOOK_SECRET,
  card: process.env.CARD_PSP_WEBHOOK_SECRET,
};

function verifySignature(secret: string | undefined, rawBody: string, signature: string | null) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Point d'entrée générique pour les webhooks des prestataires de paiement.
 * Adaptez le parsing du payload au format réel documenté par chaque
 * opérateur (Orange Money, MTN MoMo, PSP carte) : ce gabarit attend un
 * contrat normalisé `{ reference, status }` et une signature HMAC-SHA256
 * dans l'en-tête `X-Signature`, calculée avec le secret partagé.
 */
export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const secret = WEBHOOK_SECRETS[provider];
  const signatureValid = verifySignature(secret, rawBody, signature);

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = { raw: rawBody };
  }

  await prisma.paymentWebhookEvent.create({
    data: {
      provider,
      eventType: (payload as { event?: string })?.event ?? "unknown",
      payload: payload as never,
      signatureValid,
      processedAt: signatureValid ? new Date() : null,
    },
  });

  if (!signatureValid) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const body = payload as { reference?: string; status?: string };
  if (!body.reference || !body.status) {
    return NextResponse.json({ ok: false, error: "malformed_payload" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({ where: { providerReference: body.reference } });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "payment_not_found" }, { status: 404 });
  }

  if (body.status === "SUCCESS" || body.status === "SUCCEEDED") {
    await markPaymentSucceeded(payment.id, body.reference);
  } else if (body.status === "FAILED" || body.status === "CANCELLED") {
    await markPaymentFailed(payment.id);
  }

  return NextResponse.json({ ok: true });
}
