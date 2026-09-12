import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { CUSTOMER_COOKIE, MAX_AGE_SECONDS, SECRET, STAFF_COOKIE, sessionCookieOptions } from "@/lib/session-core";

// Prolonge la session de connexion à chaque visite, pour qu'un compte reste
// connecté sur l'appareil tant qu'il est utilisé de temps en temps, comme
// dans la plupart des applications mobiles (déconnexion uniquement manuelle).
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  for (const name of [STAFF_COOKIE, CUSTOMER_COOKIE]) {
    const token = request.cookies.get(name)?.value;
    if (!token) continue;

    try {
      const decoded = jwt.verify(token, SECRET) as Record<string, unknown>;
      delete decoded.iat;
      delete decoded.exp;
      delete decoded.nbf;
      const refreshed = jwt.sign(decoded, SECRET, { expiresIn: MAX_AGE_SECONDS });
      response.cookies.set(name, refreshed, sessionCookieOptions());
    } catch {
      // Session invalide ou expirée : les pages géreront la redirection vers la connexion.
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
