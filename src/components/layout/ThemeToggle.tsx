"use client";

import { Moon, Sun } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { HAPTIC } from "@/hooks/use-haptics";
import { cn } from "@/lib/utils";

export const THEME_STORAGE_KEY = "campus-hub-theme";

/**
 * Icon visibility is driven by the `.dark` class in CSS rather than React
 * state, so the button renders correctly on the server pass and never
 * hydration-mismatches against the pre-paint theme script.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // No OS listener: dark is the app's default, not a mirror of system settings.
  const toggle = () => {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled — the choice just won't persist.
    }
  };

  return (
    <GlassButton
      variant="glass"
      size="icon"
      onClick={toggle}
      haptic={HAPTIC.select}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={cn("size-10", className)}
    >
      <Sun size={18} strokeWidth={2.1} className="dark:hidden" aria-hidden />
      <Moon
        size={18}
        strokeWidth={2.1}
        className="hidden dark:block"
        aria-hidden
      />
    </GlassButton>
  );
}
