import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Display face for headings — the app's typographic signature. */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Campus Hub — Events, Clubs & Duty",
    template: "%s · Campus Hub",
  },
  description:
    "One place for college events, club activities, announcements and coordinator duty rosters.",
  applicationName: "Campus Hub",
  appleWebApp: {
    capable: true,
    title: "Campus Hub",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Required for `env(safe-area-inset-*)` to report real values on iOS.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1018" },
  ],
};

/**
 * Applies the theme before first paint. Inline and blocking on purpose — a
 * `useEffect` here would flash the wrong theme on every load.
 *
 * Dark is the default rather than the OS preference: the starfield is the
 * app's identity, and following a light OS setting would hide it from most
 * people who never open the toggle.
 */
const THEME_SCRIPT = `
(function(){try{
  var stored = localStorage.getItem('campus-hub-theme');
  document.documentElement.classList.toggle('dark', stored !== 'light');
}catch(e){ document.documentElement.classList.add('dark'); }})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
