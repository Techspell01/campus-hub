"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * `template.tsx` remounts on every navigation (unlike `layout.tsx`), which is
 * what lets each route play an entrance without wiring AnimatePresence through
 * the router.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
