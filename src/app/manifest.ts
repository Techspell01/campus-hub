import type { MetadataRoute } from "next";

/**
 * Web app manifest — what Android reads when someone installs to the home
 * screen, and what gives the app its own window instead of a browser tab.
 *
 * iOS ignores this for the icon and uses `apple-icon.png` instead, which is
 * why both exist. It does honour `display` and `theme_color`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campus Hub — Events, Clubs & Duty",
    short_name: "Campus Hub",
    description:
      "College events, club activities, announcements, QR tickets and volunteer duty rosters.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    // Matches the void so there is no white flash while the app boots.
    background_color: "#000001",
    theme_color: "#000001",
    categories: ["education", "events", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // Android crops adaptive icons to a circle; this variant keeps the mark
      // inside the safe area so the points don't get shaved off.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
