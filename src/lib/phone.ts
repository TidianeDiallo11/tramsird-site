/**
 * Canonicalizes a Guinean phone number so the same number always matches
 * regardless of whether the user typed a country code, spaces, or dashes
 * (e.g. "622 00 00 01", "622000001" and "+224 622 00 00 01" all normalize
 * to "+224 622 00 00 01"). Falls back to the trimmed input when it doesn't
 * look like a Guinean number, so foreign numbers aren't mangled.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  const local = digits.startsWith("224") ? digits.slice(3) : digits;

  if (local.length !== 9) return trimmed;

  return `+224 ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}
