import jwt from "jsonwebtoken";

// "||" et non "??" : une variable d'environnement mal configurée (chaîne
// vide) doit retomber sur le secret de secours, pas planter jwt.sign() avec
// "secretOrPrivateKey doit avoir une valeur".
export const SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-me-in-production-please";
export const STAFF_COOKIE = "sf_staff_session";
export const CUSTOMER_COOKIE = "sf_customer_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // ~400 jours (maximum autorisé par les navigateurs)

export function signSession(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: MAX_AGE_SECONDS });
}

export function verifySession<T>(token: string | undefined): T | null {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as T;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
