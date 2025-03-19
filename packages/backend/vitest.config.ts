import { defineConfig } from "vitest/config"

// https://vitest.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      src: "/src",
    },
  },
  test: {
    diff: "./vitest.diff.ts",
    environment: "node",
    exclude: ["**/node_modules/**", "**/dist/**", "test/bun/**"],
    // TODO5
    // coverage: {
    //   reporter: ["text", "html"],
    // },
    globals: true,
    maxConcurrency: 32,
    reporters: ["verbose"],
    testTimeout: 30 * 60_000,
  },
})
