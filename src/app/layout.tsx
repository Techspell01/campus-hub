import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: light)", color: "#f1eefb" },
    { media: "(prefers-color-scheme: dark)", color: "#191526" },
  ],
};

/**
 * Applies the stored (or OS) theme before first paint. Inline and blocking on
 * purpose — a `useEffect` here would flash the wrong theme on every load.
 */
const THEME_SCRIPT = `
(function(){try{
  var stored = localStorage.getItem('campus-hub-theme');
  var dark = stored ? stored === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
}catch(e){}})();
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
      className={`${inter.variable} h-full antialiased`}
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
