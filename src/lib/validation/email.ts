/**
 * Shared email validation.
 *
 * ASCII-strict (RFC-5322-ish dot-atom) validator — intentionally rejects
 * unicode/IDN, consecutive dots, leading/trailing dots, TLD < 2 chars,
 * misplaced hyphens, and trailing dots. Unblocks 10+ invalid formats the old
 * loose `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` accepted (Finding #6).
 */

// Local part: dot-atom (no leading/trailing/consecutive dots).
// Domain: labels `[A-Za-z0-9]` with optional inner hyphens, at least 1 dot
// (blocks bare domain / localhost), final TLD alpha 2-63.
// Verified against a 26-case battery (scratch-regex-check3.mjs, task t_589c751c).
const EMAIL_REGEX =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,63}$/;

/**
 * Validate an email address (ASCII-strict).
 * Returns false for non-strings and any format violating the rules above.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length === 0 || email.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}
