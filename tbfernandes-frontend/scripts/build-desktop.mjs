// `npm run build:desktop`: next build with TBF_TARGET=desktop (static export, see next.config.ts).
// A script instead of `TBF_TARGET=desktop next build` so it also runs in Windows' cmd.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, TBF_TARGET: "desktop" },
});
process.exit(result.status ?? 1);
