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
};

export default nextConfig;
