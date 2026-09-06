"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a QR as inline SVG on a solid white plate.
 *
 * The plate is not decoration: scanners need real contrast, and dark modules
 * over a frosted, semi-transparent panel decode badly — especially in dark
 * mode. So the glass surrounds the code rather than sitting behind it.
 */
export function QrImage({
  value,
  className,
  /** Bump to "Q" for codes shown on a glossy screen under stage lighting. */
  errorCorrectionLevel = "M",
}: {
  value: string;
  className?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}) {
  // One state object tagged with the value it belongs to. Keeping the tag
  // means a stale render is detected by comparison instead of by resetting
  // state synchronously inside the effect, which would cascade a render.
  const [render, setRender] = useState<{
    value: string;
    svg: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toString(value, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel,
      color: { dark: "#0b0b12ff", light: "#00000000" },
    })
      .then((markup) => {
        if (!cancelled) setRender({ value, svg: markup });
      })
      .catch(() => {
        if (!cancelled) setRender({ value, svg: null });
      });

    return () => {
      cancelled = true;
    };
  }, [value, errorCorrectionLevel]);

  const current = render?.value === value ? render : null;
  const svg = current?.svg ?? null;
  const failed = current !== null && current.svg === null;

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5",
        className,
      )}
    >
      {failed ? (
        <div className="grid h-full place-items-center px-4 text-center text-[12px] text-neutral-500">
          Couldn&apos;t render this code.
        </div>
      ) : svg ? (
        <div
          // Markup comes from the qrcode library over our own token — no
          // user-supplied content reaches this.
          dangerouslySetInnerHTML={{ __html: svg }}
          className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl bg-neutral-100" />
      )}
    </div>
  );
}
