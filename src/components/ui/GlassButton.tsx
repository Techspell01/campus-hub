"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { hapticHover, hapticTap, pressSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

export type GlassButtonVariant =
  | "glass"
  | "primary"
  | "whatsapp"
  | "ghost"
  | "danger";

export type GlassButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<GlassButtonVariant, string> = {
  // Frosted pane — the default. `glass` + `glass-shine` come from globals.css.
  glass: "glass glass-shine text-ink",
  primary:
    "glass-shine bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 " +
    "text-white shadow-lg shadow-blue-500/30 border border-white/20",
  // WhatsApp brand green, kept literal so the button is recognisable at a glance.
  whatsapp:
    "glass-shine bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white " +
    "shadow-lg shadow-emerald-600/25 border border-white/20",
  ghost: "text-ink-muted border border-transparent",
  danger:
    "glass-shine bg-gradient-to-br from-rose-500 to-red-600 text-white " +
    "shadow-lg shadow-rose-500/30 border border-white/20",
};

// Icons are sized in CSS rather than by prop so a caller can pass any `<Icon />`
// — including from a server component — and still get consistent metrics.
const SIZES: Record<GlassButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 [&_svg]:size-[15px]",
  md: "h-11 px-5 text-sm gap-2 [&_svg]:size-[17px]",
  lg: "h-13 px-7 text-base gap-2.5 [&_svg]:size-[19px]",
  icon: "size-11 p-0 [&_svg]:size-[19px]",
};

interface BaseProps {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  /**
   * A rendered element (`<Send />`), not a component reference. React can
   * serialise elements across the server/client boundary; functions it cannot.
   */
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  title?: string;
  "aria-label"?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Vibration pattern for the press. Pass `null` to stay silent. */
  haptic?: number | readonly number[] | null;
}

type LinkProps = BaseProps & {
  href: string;
  /** Opens in a new tab with `rel="noopener"`. Required for wa.me links. */
  external?: boolean;
  type?: never;
};

type ButtonProps = BaseProps & {
  href?: never;
  external?: never;
  type?: "button" | "submit" | "reset";
};

export type GlassButtonProps = LinkProps | ButtonProps;

/**
 * The app's one interactive control.
 *
 * Every press runs the same spring — a 0.96 scale-down on `whileTap` released
 * through `pressSpring` — which is what reads as iOS haptic feedback. Because
 * the timing lives in `lib/motion.ts`, tuning it once retunes the whole app.
 */
export function GlassButton(props: GlassButtonProps) {
  const {
    variant = "glass",
    size = "md",
    icon,
    iconRight,
    fullWidth,
    disabled,
    className,
    children,
    onClick,
    haptic = HAPTIC.tap,
    title,
    "aria-label": ariaLabel,
  } = props;

  const vibrate = useHaptics();

  const classes = cn(
    "group relative isolate inline-flex select-none items-center justify-center",
    "rounded-pill font-medium tracking-[-0.01em] whitespace-nowrap outline-offset-2",
    "[&_svg]:shrink-0 [&_svg]:[stroke-width:2.1]",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    disabled && "pointer-events-none opacity-45 saturate-50",
    className,
  );

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (haptic !== null) vibrate(haptic);
    onClick?.(event);
  };

  // A hover/active wash rendered as its own layer. Doing it with `hover:bg-*`
  // would race the `glass` utility for specificity; an overlay always wins.
  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 rounded-[inherit]",
          "bg-white/0 transition-colors duration-200",
          "group-hover:bg-white/25 group-active:bg-white/35",
          "dark:group-hover:bg-white/10 dark:group-active:bg-white/[0.14]",
        )}
      />
      {icon}
      {children ? <span className="truncate">{children}</span> : null}
      {iconRight}
    </>
  );

  const motionProps = {
    whileTap: disabled ? undefined : hapticTap,
    whileHover: disabled ? undefined : hapticHover,
    transition: pressSpring,
  };

  // Props are listed explicitly rather than rest-spread: spreading the leftover
  // of a discriminated union leaks `icon`, `variant` and friends onto the DOM
  // node, which React then warns about at runtime.
  const shared = {
    className: classes,
    title,
    "aria-label": ariaLabel,
    onClick: handleClick,
  };

  if (props.href !== undefined) {
    if (props.external) {
      return (
        <motion.a
          {...motionProps}
          {...shared}
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </motion.a>
      );
    }

    return (
      <MotionLink {...motionProps} {...shared} href={props.href}>
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      {...motionProps}
      {...shared}
      type={props.type ?? "button"}
      disabled={disabled}
    >
      {content}
    </motion.button>
  );
}
