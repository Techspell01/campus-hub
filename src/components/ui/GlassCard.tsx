"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { HAPTIC, useHaptics } from "@/hooks/use-haptics";
import { hapticTapCard, surfaceSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Adds the press-back spring. Implied when `href` is set. */
  interactive?: boolean;
  href?: string;
  onClick?: () => void;
  /** Higher opacity + blur, for surfaces content scrolls beneath. */
  strong?: boolean;
  ariaLabel?: string;
}

/**
 * The base frosted panel. Everything else in the app is this plus content.
 * Cards press with `hapticTapCard` (0.975) rather than the button's 0.96 —
 * larger surfaces need less travel to read as the same amount of give.
 */
export function GlassCard({
  children,
  className,
  interactive,
  href,
  onClick,
  strong,
  ariaLabel,
}: GlassCardProps) {
  const vibrate = useHaptics();
  const isInteractive = Boolean(interactive || href || onClick);

  const classes = cn(
    "relative isolate overflow-hidden rounded-glass",
    strong ? "glass-strong" : "glass",
    "glass-shine",
    isInteractive && "cursor-pointer",
    className,
  );

  const motionProps = isInteractive
    ? {
        whileTap: hapticTapCard,
        whileHover: { y: -3 },
        transition: surfaceSpring,
      }
    : {};

  const handleClick = () => {
    if (isInteractive) vibrate(HAPTIC.select);
    onClick?.();
  };

  if (href) {
    return (
      <MotionLink
        href={href}
        aria-label={ariaLabel}
        className={classes}
        onClick={handleClick}
        {...motionProps}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.div
      className={classes}
      aria-label={ariaLabel}
      onClick={isInteractive ? handleClick : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
