import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { ResetAccountType } from "@/generated/prisma/enums";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function generateNumericCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function generateLinkToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function createToken(accountType: ResetAccountType, accountId: string, token: string) {
  await prisma.passwordResetToken.create({
    data: {
      token,
      accountType,
      accountId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

/** Client (connexion par téléphone) : code à 6 chiffres envoyé par SMS. */
export function createCustomerResetCode(customerId: string) {
  return createToken("CUSTOMER", customerId, generateNumericCode());
}

/** Équipe (connexion par email) : jeton long inclus dans un lien envoyé par email. */
export function createStaffResetToken(userId: string) {
  return createToken("STAFF", userId, generateLinkToken());
}

export async function consumePasswordResetToken(accountType: ResetAccountType, token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.accountType !== accountType) return null;
  if (record.usedAt || record.expiresAt < new Date()) return null;

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.accountId;
}
