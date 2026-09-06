"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

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
  useEffect(() => {
    // Follow the OS while the student hasn't made an explicit choice.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      document.documentElement.classList.toggle("dark", event.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

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
