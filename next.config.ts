import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// There is a stray package-lock.json in the parent directory (the Windows home
// folder), which Turbopack would otherwise treat as the workspace root. Pin the
// root to this project so module resolution and file watching stay scoped.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },

  experimental: {
    /**
     * Client-side router cache.
     *
     * Every route here is dynamic, and the default for dynamic segments is 0 —
     * nothing is reused, so returning to a tab you were just on costs another
     * full trip to a server on the other side of the world. Holding the
     * rendered segment briefly makes going back instant.
     *
     * The windows are short on purpose. Server actions call `revalidatePath`
     * whenever they change something, which clears this cache, so the risk is
     * limited to data changed by *someone else* in the last half minute —
     * acceptable for an events list, and the duty roster polls on its own
     * regardless.
     */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
