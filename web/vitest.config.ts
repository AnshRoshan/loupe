import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    // The engine's own suite runs from the monorepo root (`nub run test` / `vitest run`).
    include: ["tests/*.test.ts"],
  },
});
