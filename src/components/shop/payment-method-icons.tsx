/**
 * Badges de moyens de paiement, dessinés en SVG (couleurs de marque) plutôt
 * que des captures du logo officiel — cet environnement n'a pas d'accès
 * réseau pour récupérer l'asset officiel. À remplacer par le vrai logo si
 * l'opérateur en fournit un.
 */
export function OrangeMoneyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-label="Orange Money" role="img">
      <rect width="32" height="32" rx="8" fill="#FF7900" />
      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#FFFFFF"
      >
        OM
      </text>
    </svg>
  );
}
