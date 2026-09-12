import "server-only";

/**
 * Envoi d'email (utilisé pour le lien de réinitialisation de mot de passe
 * de l'équipe, qui se connecte par email).
 *
 * Implémentation via l'API HTTP de Resend (https://resend.com) — un
 * fournisseur avec une offre gratuite largement suffisante pour ce volume
 * d'envoi. Il suffit de créer un compte, de vérifier un domaine d'envoi et
 * de renseigner EMAIL_API_KEY + EMAIL_FROM en variables d'environnement.
 * Sans ces variables, le lien est simplement journalisé côté serveur.
 */
export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean }> {
  if (!isEmailConfigured()) {
    console.warn(
      `[email] Non configuré (EMAIL_API_KEY / EMAIL_FROM manquants). Email pour ${to} — ${subject}\n${html}`,
    );
    return { ok: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    console.error(`[email] Échec de l'envoi (${response.status}) : ${await response.text()}`);
    return { ok: false };
  }

  return { ok: true };
}
