/**
 * wa.me deep links for the coordinator directory.
 *
 * wa.me is intentionally strict: the path must be digits only — no `+`, no
 * spaces, no trunk zero — and it must include the country code. Anything else
 * lands the student on WhatsApp's "phone number is invalid" page, so all
 * normalisation happens here rather than at the call sites.
 */

/** Campus is in India; override per-contact for international faculty. */
export const DEFAULT_COUNTRY_CODE = "91";

const HONORIFICS = new Set([
  "dr",
  "prof",
  "mr",
  "ms",
  "mrs",
  "shri",
  "smt",
  "capt",
]);

/**
 * Normalise a human-entered phone number into the digits wa.me expects.
 * Returns `null` when there is nothing dialable, so the UI can hide the button
 * instead of rendering a link that dead-ends.
 */
export function toWhatsAppNumber(
  raw: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!raw) return null;

  const hadPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Directories often print the domestic trunk prefix ("098765 43210").
  const national = digits.replace(/^0+/, "");
  if (!national) return null;

  // An explicit `+`, or anything longer than a plain subscriber number, already
  // carries its own country code.
  if (hadPlus || national.length > 10) return national;

  return `${countryCode}${national}`;
}

/** "Dr. Meera Nair" -> "Dr. Meera"; "Aarav Sharma" -> "Aarav". */
function greetingName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "there";

  const head = parts[0].replace(/\.$/, "").toLowerCase();
  if (HONORIFICS.has(head) && parts[1]) return `${parts[0]} ${parts[1]}`;

  return parts[0];
}

export interface WhatsAppLinkOptions {
  /** Any human format: "+91 98765 43210", "098765-43210", "9876543210". */
  phone: string;
  /** Recipient's display name, used to open the message. */
  name: string;
  /** e.g. "Stage Management" — the coordinator's duty area. */
  dutyArea?: string;
  /** e.g. "Aurora Fest 2026". */
  eventName?: string;
  /**
   * Override the generated copy. Supports `{name}`, `{dutyArea}` and
   * `{eventName}` placeholders.
   */
  template?: string;
  countryCode?: string;
}

/**
 * Build the pre-filled message. Degrades cleanly when duty area or event are
 * unknown — a half-filled sentence reads worse than a shorter complete one.
 */
export function buildWhatsAppMessage({
  name,
  dutyArea,
  eventName,
  template,
}: Omit<WhatsAppLinkOptions, "phone" | "countryCode">): string {
  const who = greetingName(name);

  if (template) {
    return template
      .replaceAll("{name}", who)
      .replaceAll("{dutyArea}", dutyArea ?? "")
      .replaceAll("{eventName}", eventName ?? "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (dutyArea && eventName) {
    return `Hi ${who}, I have a doubt regarding ${dutyArea} for ${eventName}.`;
  }
  if (eventName) {
    return `Hi ${who}, I have a doubt regarding ${eventName}.`;
  }
  if (dutyArea) {
    return `Hi ${who}, I have a doubt regarding ${dutyArea}.`;
  }
  return `Hi ${who}, I have a question about an upcoming college event.`;
}

/**
 * Full `https://wa.me/<number>?text=<message>` URL, or `null` if the contact
 * has no usable number.
 */
export function buildWhatsAppUrl(options: WhatsAppLinkOptions): string | null {
  const number = toWhatsAppNumber(options.phone, options.countryCode);
  if (!number) return null;

  const text = buildWhatsAppMessage(options);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
