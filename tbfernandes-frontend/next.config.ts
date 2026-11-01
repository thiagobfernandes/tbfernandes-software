import type { NextConfig } from "next";

/**
 * `TBF_TARGET=desktop npm run build` exports static files to `out/` for the
 * Windows app (Tauri), which loads them from disk and talks to the local
 * backend. Any other build is the self-contained server for the Docker image.
 */
const desktop = process.env.TBF_TARGET === "desktop";

const nextConfig: NextConfig = {
  ...(desktop
    ? { output: "export", trailingSlash: true, images: { unoptimized: true } }
    : { output: "standalone" }),
  env: { NEXT_PUBLIC_TBF_TARGET: desktop ? "desktop" : "web" },
  // Both need a Next server; the static export has none.
  cacheComponents: !desktop,
  partialPrefetching: !desktop,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
