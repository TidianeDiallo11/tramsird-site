import "server-only";
import { cookies } from "next/headers";
import type { StaffRole } from "@/generated/prisma/enums";
import {
  CUSTOMER_COOKIE,
  STAFF_COOKIE,
  sessionCookieOptions,
  signSession,
  verifySession,
} from "@/lib/session-core";

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

export async function createStaffSession(payload: StaffSessionPayload) {
  const token = signSession(payload);
  const store = await cookies();
  store.set(STAFF_COOKIE, token, sessionCookieOptions());
}

export async function getStaffSession(): Promise<StaffSessionPayload | null> {
  const store = await cookies();
  return verifySession<StaffSessionPayload>(store.get(STAFF_COOKIE)?.value);
}

export async function clearStaffSession() {
  const store = await cookies();
  store.delete(STAFF_COOKIE);
}

export async function createCustomerSession(payload: CustomerSessionPayload) {
  const token = signSession(payload);
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, sessionCookieOptions());
}

export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const store = await cookies();
  return verifySession<CustomerSessionPayload>(store.get(CUSTOMER_COOKIE)?.value);
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export { STAFF_COOKIE, CUSTOMER_COOKIE };
