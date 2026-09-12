import "server-only";

/**
 * Envoi de SMS (utilisé pour le code de réinitialisation de mot de passe
 * client, qui se connecte par numéro de téléphone).
 *
 * Aucun fournisseur SMS n'est branché pour l'instant : il faut un compte
 * auprès d'un opérateur (ex. API SMS Orange) fournissant une URL d'API et
 * une clé, exactement comme pour Orange Money. Tant que SMS_API_BASE_URL et
 * SMS_API_KEY ne sont pas renseignés, le message est simplement journalisé
 * côté serveur (utile en développement) et l'envoi réel est refusé.
 */
export function isSmsConfigured() {
  return Boolean(process.env.SMS_API_BASE_URL && process.env.SMS_API_KEY);
}

export async function sendSms(to: string, message: string): Promise<{ ok: boolean }> {
  if (!isSmsConfigured()) {
    console.warn(
      `[sms] Non configuré (SMS_API_BASE_URL / SMS_API_KEY manquants). Message pour ${to} : ${message}`,
    );
    return { ok: false };
  }

  // Exemple d'intégration réelle (à adapter selon le contrat du fournisseur SMS) :
  //
  // await fetch(`${process.env.SMS_API_BASE_URL}/messages`, {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.SMS_API_KEY}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ to, message, sender: process.env.SMS_SENDER_ID ?? "NLTRADING" }),
  // });

  console.warn("[sms] Intégration SMS non implémentée pour cet environnement.");
  return { ok: false };
}
