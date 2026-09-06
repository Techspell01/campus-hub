"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: {
      formats?: string[];
    }) => BarcodeDetectorLike;
  }
}

export type ScannerStatus =
  | "idle"
  | "starting"
  | "scanning"
  | "insecure"
  | "denied"
  | "unavailable"
  | "error";

/** ~10fps. Enough to feel instant; far cheaper on battery than every frame. */
const SCAN_INTERVAL_MS = 100;

/**
 * Camera QR scanner.
 *
 * Uses the browser's native `BarcodeDetector` where it exists (Chrome and
 * Android, hardware-accelerated) and falls back to decoding canvas pixels with
 * jsQR everywhere else — which is what actually runs on iOS Safari.
 */
export function QrScanner({
  onDecode,
  paused = false,
  overlay,
  className,
}: {
  onDecode: (value: string) => void;
  /** Freeze decoding while a result is being shown, without dropping the feed. */
  paused?: boolean;
  /** Drawn over the viewport — used by the gate to flash a verdict in place. */
  overlay?: ReactNode;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const pausedRef = useRef(paused);
  const onDecodeRef = useRef(onDecode);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // Kept in refs so changing them never restarts the camera.
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  const decodeFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || pausedRef.current || video.readyState < 2) return;

    if (detectorRef.current) {
      try {
        const [hit] = await detectorRef.current.detect(video);
        if (hit?.rawValue) onDecodeRef.current(hit.rawValue);
        return;
      } catch {
        // Detector failed on this frame; drop to the jsQR path below.
        detectorRef.current = null;
      }
    }

    const canvas = (canvasRef.current ??= document.createElement("canvas"));
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const result = jsQR(image.data, width, height, {
      inversionAttempts: "dontInvert",
    });

    if (result?.data) onDecodeRef.current(result.data);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let cancelled = false;

    async function start() {
      // getUserMedia is gated to secure contexts — plain http on a LAN IP has
      // no camera at all, which is the most common failure here.
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus(window.isSecureContext ? "unavailable" : "insecure");
        return;
      }

      setStatus("starting");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) return;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        if (window.BarcodeDetector) {
          try {
            detectorRef.current = new window.BarcodeDetector({
              formats: ["qr_code"],
            });
          } catch {
            detectorRef.current = null;
          }
        }

        setStatus("scanning");
        timer = window.setInterval(decodeFrame, SCAN_INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof Error ? error.name : "";

        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setStatus("unavailable");
        } else {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : null);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
      detectorRef.current = null;
    };
  }, [decodeFrame]);

  const HINTS: Record<ScannerStatus, string | null> = {
    idle: null,
    starting: "Waking the camera…",
    scanning: null,
    insecure:
      "Cameras only work over HTTPS or on localhost. Open this page over https, or type the code in below.",
    denied:
      "Camera permission was blocked. Allow it in your browser settings, or type the code in below.",
    unavailable:
      "No camera available on this device. Type the code in below instead.",
    error: message ?? "The camera failed to start.",
  };

  const hint = HINTS[status];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="glass glass-shine relative isolate aspect-square w-full overflow-hidden rounded-glass">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500",
            status === "scanning" ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Reticle */}
        {status === "scanning" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <div className="relative size-3/5">
              {[
                "top-0 left-0 rounded-tl-xl border-t-[3px] border-l-[3px]",
                "top-0 right-0 rounded-tr-xl border-t-[3px] border-r-[3px]",
                "bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]",
                "bottom-0 right-0 rounded-br-xl border-b-[3px] border-r-[3px]",
              ].map((corner) => (
                <span
                  key={corner}
                  className={cn("absolute size-8 border-white/90", corner)}
                />
              ))}
            </div>
          </div>
        )}

        {hint && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <p className="max-w-xs text-center text-[13px] leading-relaxed text-ink-muted">
              {hint}
            </p>
          </div>
        )}

        {overlay}
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "scanning" ? "Camera ready, point at the QR code." : hint}
      </p>
    </div>
  );
}
