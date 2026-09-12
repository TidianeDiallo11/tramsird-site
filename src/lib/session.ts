import "server-only";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { StaffRole } from "@/generated/prisma/enums";

const SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me-in-production-please";
const STAFF_COOKIE = "sf_staff_session";
const CUSTOMER_COOKIE = "sf_customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // ~400 jours (maximum autorisé par les navigateurs) : reste connecté jusqu'à déconnexion manuelle

export type StaffSessionPayload = {
  sub: string;
  role: StaffRole;
  name: string;
  email: string;
};

export type CustomerSessionPayload = {
  sub: string;
  name: string;
  phone: string;
};

function sign(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE_SECONDS });
}

function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}

export async function createStaffSession(payload: StaffSessionPayload) {
  const token = sign(payload);
  const store = await cookies();
  store.set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getStaffSession(): Promise<StaffSessionPayload | null> {
  const store = await cookies();
  return verify<StaffSessionPayload>(store.get(STAFF_COOKIE)?.value);
}

export async function clearStaffSession() {
  const store = await cookies();
  store.delete(STAFF_COOKIE);
}

export async function createCustomerSession(payload: CustomerSessionPayload) {
  const token = sign(payload);
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const store = await cookies();
  return verify<CustomerSessionPayload>(store.get(CUSTOMER_COOKIE)?.value);
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export { STAFF_COOKIE, CUSTOMER_COOKIE };
