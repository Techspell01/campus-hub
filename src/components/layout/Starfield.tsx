"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  /** Downward drift in px per second. Bigger stars move faster — parallax. */
  speed: number;
  baseAlpha: number;
  /** Phase offset so stars don't all twinkle in unison. */
  phase: number;
  twinkle: number;
  /** Index into PALETTE. Stars are sorted by it so fillStyle rarely changes. */
  colour: number;
}

/**
 * Stars by surface temperature, hot to cool.
 *
 * A sky of identical white dots is the clearest sign of a synthetic
 * starfield. Real stars run from blue-white through white and yellow to
 * orange, weighted heavily to the pale end — so the warm ones read as
 * occasional accents rather than confetti.
 */
const PALETTE = [
  "#e8e9ec", // neutral white
  "#f7f6f4", // white
  "#ffffff", // white
  "#fff7ec", // warm white
  "#ffedd0", // yellow
  "#ffd6ab", // orange
];

const COLOUR_WEIGHTS = [0.12, 0.26, 0.3, 0.18, 0.1, 0.04];

function pickColour() {
  let roll = Math.random();
  for (let i = 0; i < COLOUR_WEIGHTS.length; i += 1) {
    roll -= COLOUR_WEIGHTS[i];
    if (roll <= 0) return i;
  }
  return 2;
}

/** Sum of two uniforms — a cheap bell curve, so the band has soft edges. */
const gaussianish = () => Math.random() + Math.random() - 1;

/** Share of stars pulled towards the galactic band rather than scattered. */
const BAND_SHARE = 0.45;

/** Stars per million square pixels — keeps density even on any screen. */
const DENSITY = 90;
const MAX_STARS = 420;

/**
 * Phones get fewer stars and a lower backing resolution.
 *
 * A modern phone reports a device pixel ratio of 3, which would mean filling
 * nine times the pixels of a logical one. Stars are 1–2px dots; past about
 * 1.5x nobody can tell, and the saving is most of the per-frame cost.
 */
const MOBILE_BREAKPOINT = 640;

/**
 * Drifting starfield on a canvas.
 *
 * Canvas rather than hundreds of DOM nodes: this is one composited layer the
 * browser can hand to the GPU, where 400 absolutely-positioned divs would each
 * need layout and paint. It also lets stars have real sub-pixel positions, so
 * the slow drift stays smooth instead of stepping pixel to pixel.
 *
 * The parent element paints the void and nebulae; this only draws the stars.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = performance.now();
    let running = true;

    function build() {
      width = window.innerWidth;
      height = window.innerHeight;

      const isPhone = width < MOBILE_BREAKPOINT;
      const ratio = Math.min(window.devicePixelRatio || 1, isPhone ? 1.5 : 2);

      canvas!.width = Math.floor(width * ratio);
      canvas!.height = Math.floor(height * ratio);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(
        MAX_STARS,
        Math.round(
          (width * height * (isPhone ? DENSITY * 0.6 : DENSITY)) / 1_000_000,
        ),
      );

      stars = Array.from({ length: count }, () => {
        // Cubed so most stars are small and faint, with a few bright ones —
        // an even spread reads as noise rather than a sky.
        const depth = Math.random() ** 3;

        // Roughly half cluster along a diagonal, the way the Milky Way crowds
        // one stripe of the real sky. A uniform scatter is what makes a
        // generated starfield look like television static.
        let x = Math.random() * width;
        let y = Math.random() * height;

        if (Math.random() < BAND_SHARE) {
          const along = Math.random();
          x = along * width;
          y = height * (0.82 - along * 0.6) + gaussianish() * height * 0.17;
        }

        return {
          x,
          y,
          radius: 0.4 + depth * 1.7,
          speed: 1.2 + depth * 6,
          baseAlpha: 0.22 + depth * 0.62,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.4 + Math.random() * 0.8,
          colour: pickColour(),
        };
      });

      // Grouped by colour so fillStyle changes about six times a frame rather
      // than once per star.
      stars.sort((a, b) => a.colour - b.colour);
    }

    function draw(now: number) {
      const elapsed = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      context!.clearRect(0, 0, width, height);

      let activeColour = -1;

      for (const star of stars) {
        if (!reduceMotion) {
          star.y += star.speed * elapsed;
          // Wrap to the top with a fresh column so no visible seam forms.
          if (star.y - star.radius > height) {
            star.y = -star.radius;
            star.x = Math.random() * width;
          }
        }

        if (star.colour !== activeColour) {
          activeColour = star.colour;
          context!.fillStyle = PALETTE[activeColour];
        }

        const flicker = reduceMotion
          ? 1
          : 0.72 + 0.28 * Math.sin(now / 1000 + star.phase) * star.twinkle;

        const alpha = Math.max(0, Math.min(1, star.baseAlpha * flicker));

        // The brightest stars carry a faint halo. Real optics bloom, and it is
        // most of what separates a bright star from a large dot.
        if (star.radius > 1.4) {
          context!.globalAlpha = alpha * 0.16;
          context!.beginPath();
          context!.arc(star.x, star.y, star.radius * 3.2, 0, Math.PI * 2);
          context!.fill();
        }

        context!.globalAlpha = alpha;

        // Below ~1px a square and a circle are indistinguishable, and
        // `fillRect` skips the path machinery `arc` needs. Most stars are
        // small, so most of them take the cheap route.
        if (star.radius < 1.1) {
          const d = star.radius * 2;
          context!.fillRect(star.x, star.y, d, d);
        } else {
          context!.beginPath();
          context!.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          context!.fill();
        }
      }

      context!.globalAlpha = 1;
      if (running && !reduceMotion) frame = requestAnimationFrame(draw);
    }

    build();
    frame = requestAnimationFrame(draw);

    const onResize = () => {
      build();
      if (reduceMotion) draw(performance.now());
    };

    // Stop burning battery while the tab is in the background.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!reduceMotion) {
        running = true;
        lastTime = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full dark:block"
    />
  );
}
