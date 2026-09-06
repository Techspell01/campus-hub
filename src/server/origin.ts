import "server-only";

import { headers } from "next/headers";

/**
 * The absolute origin this request arrived on.
 *
 * QR codes have to encode a full URL, and reading `window.location` in an
 * effect meant the code rendered blank for a frame and forced a client-side
 * state round-trip. Taking it from the request headers means the QR is correct
 * in the very first HTML the browser receives.
 *
 * Uses the `x-forwarded-*` pair first so it stays right behind a proxy.
 */
export async function requestOrigin(): Promise<string> {
  const headerList = await headers();

  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";

  const isLocal = /^(localhost|127\.|\[::1\])/.test(host);
  const protocol =
    headerList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}
