import { NextResponse } from "next/server";

import { extractTicketCode } from "@/lib/scan-payload";
import { apiCoordinator } from "@/server/auth/api-guard";
import { findEventById } from "@/server/repositories/events";
import { redeemTicket, ticketCounts } from "@/server/repositories/tickets";

export const dynamic = "force-dynamic";

/**
 * Admit a ticket holder at the gate.
 *
 * Takes whatever the camera decoded — the full `/verify?c=…` URL or a bare
 * code — and unwraps it here, so no client has to know the QR's shape.
 */
export async function POST(request: Request) {
  const auth = await apiCoordinator();
  if (auth instanceof NextResponse) return auth;

  let body: { code?: unknown };
  try {
    body = (await request.json()) as { code?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json({ error: "Missing ticket code." }, { status: 400 });
  }

  const code = extractTicketCode(body.code);
  if (!code) {
    return NextResponse.json({
      result: { status: "invalid" },
      counts: await ticketCounts(),
    });
  }

  const result = await redeemTicket(code, auth.id);

  // A rejected pass is a normal gate outcome, not an HTTP error — the scanner
  // needs to render it the same way it renders a success.
  const event =
    result.status === "invalid"
      ? null
      : await findEventById(result.ticket.eventId, true);

  return NextResponse.json({
    result,
    event: event && { id: event.id, title: event.title, venue: event.venue },
    counts: await ticketCounts(),
  });
}
