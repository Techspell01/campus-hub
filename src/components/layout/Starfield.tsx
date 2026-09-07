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
}

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

    /** Reads the star colour from CSS, so it flips with the theme. */
    const starColour = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--star")
        .trim() || "#fff";

    let colour = starColour();

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
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.4 + depth * 1.6,
          speed: 1.5 + depth * 7,
          baseAlpha: 0.25 + depth * 0.6,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.4 + Math.random() * 0.8,
        };
      });
    }

    function draw(now: number) {
      const elapsed = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      context!.clearRect(0, 0, width, height);
      context!.fillStyle = colour;

      for (const star of stars) {
        if (!reduceMotion) {
          star.y += star.speed * elapsed;
          // Wrap to the top with a fresh column so no visible seam forms.
          if (star.y - star.radius > height) {
            star.y = -star.radius;
            star.x = Math.random() * width;
          }
        }

        const flicker = reduceMotion
          ? 1
          : 0.72 + 0.28 * Math.sin(now / 1000 + star.phase) * star.twinkle;

        context!.globalAlpha = Math.max(
          0,
          Math.min(1, star.baseAlpha * flicker),
        );

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

    // The theme toggle swaps --star; pick the new value up without a reload.
    const themeObserver = new MutationObserver(() => {
      colour = starColour();
      if (reduceMotion) draw(performance.now());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
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
