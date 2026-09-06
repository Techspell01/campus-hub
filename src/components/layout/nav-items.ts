import {
  CalendarDays,
  ScanLine,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown on the sidebar only — too much text for the bottom bar. */
  hint: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Hub", icon: Sparkles, hint: "What's happening now" },
  {
    href: "/events",
    label: "Events",
    icon: CalendarDays,
    hint: "Calendar & details",
  },
  { href: "/clubs", label: "Clubs", icon: Users, hint: "All campus clubs" },
  { href: "/wallet", label: "Wallet", icon: Ticket, hint: "Your QR tickets" },
  { href: "/duty", label: "Duty", icon: ScanLine, hint: "Roster & check-in" },
];

/** `/` must match exactly or it lights up on every route. */
export const isActiveRoute = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);
