import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markPaymentSucceeded, markPaymentFailed } from "@/lib/payments/payment-service";

function safeParseJson(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody);
  } catch {
    return { raw: rawBody };
  }
}

/**
 * Djomy signe le corps du webhook avec le clientSecret et place le résultat
 * dans l'en-tête `X-Webhook-Signature`, au format `v1:<hex>`.
 * https://developers.djomy.africa/ (rubrique Webhooks)
 */
function verifyDjomySignature(rawBody: string, header: string | null) {
  const secret = process.env.DJOMY_CLIENT_SECRET;
  if (!secret || !header) return false;
  const [version, signature] = header.split(":");
  if (version !== "v1" || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

type DjomyWebhookPayload = {
  eventType?: string;
  data?: {
    payment?: { merchantPaymentReference?: string; transactionId?: string };
    payout?: unknown;
    merchantPaymentReference?: string;
    transactionId?: string;
  };
};

async function handleDjomyWebhook(rawBody: string, request: Request) {
  const signatureHeader = request.headers.get("x-webhook-signature");
  const signatureValid = verifyDjomySignature(rawBody, signatureHeader);
  const payload = safeParseJson(rawBody) as DjomyWebhookPayload;

  await prisma.paymentWebhookEvent.create({
    data: {
      provider: "djomy",
      eventType: payload?.eventType ?? "unknown",
      payload: payload as never,
      signatureValid,
      processedAt: signatureValid ? new Date() : null,
    },
  });

  if (!signatureValid) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  // Payload V1 : les données du paiement sont directement dans `data`.
  // Payload V2 : elles sont dans `data.payment` (les payouts sont ignorés ici,
  // ce site ne gère que les paiements entrants).
  const eventData = payload?.data?.payment ?? payload?.data ?? {};
  const merchantPaymentReference = eventData.merchantPaymentReference;
  const transactionId = eventData.transactionId;

  if (!merchantPaymentReference) {
    return NextResponse.json({ ok: false, error: "malformed_payload" }, { status: 400 });
  }

  // `merchantPaymentReference` a été renseigné à l'appel avec notre id de
  // paiement interne (cf. DjomyProvider.initiate) : pas besoin de chercher
  // par providerReference.
  const payment = await prisma.payment.findUnique({ where: { id: merchantPaymentReference } });
  if (!payment) {
    return NextResponse.json({ ok: false, error: "payment_not_found" }, { status: 404 });
  }

  if (payload?.eventType === "payment.success") {
    await markPaymentSucceeded(payment.id, transactionId);
  } else if (
    payload?.eventType === "payment.failed" ||
    payload?.eventType === "payment.cancelled" ||
    payload?.eventType === "payment.timeout"
  ) {
    await markPaymentFailed(payment.id);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

  if (provider !== "djomy") {
    return NextResponse.json({ ok: false, error: "unknown_provider" }, { status: 404 });
  }

  const rawBody = await request.text();
  return handleDjomyWebhook(rawBody, request);
}
