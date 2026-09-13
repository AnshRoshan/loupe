import { defineConfig } from "vitest/config";

// Scope the root suite to the monorepo packages (+ evals *.test.mjs). The
// `web/` Next.js app has its own vitest config and dependency tree — run it
// from `web/` — and the unmerged working copy in "full-stack-loupe-redesign (3)/"
// is not part of the root suite.
export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "evals/*.test.mjs"],
  },
});
