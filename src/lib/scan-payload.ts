/**
 * Unwrapping whatever a camera decoded.
 *
 * Both QR kinds in this app encode a full URL rather than a bare code, so that
 * a phone's built-in camera can act on them without any app installed:
 *
 *   duty check-in  →  https://host/duty/scan?t=<token>
 *   event ticket   →  https://host/verify?c=<code>
 *
 * A scanner may hand back that URL, or a code someone typed in by hand. Both
 * are accepted here so call sites never have to care which they got.
 */

export function extractParam(scanned: string, key: string): string | null {
  const trimmed = scanned.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).searchParams.get(key);
  } catch {
    // Not a URL — treat the whole string as the code itself.
    return trimmed;
  }
}

/** Duty session check-in token. */
export const extractDutyToken = (scanned: string) => extractParam(scanned, "t");

/** Event ticket code. */
export const extractTicketCode = (scanned: string) =>
  extractParam(scanned, "c");
