import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: {
        "api-worker": "src/api-worker.ts",
        bun: "src/start.ts",
        // 'web-worker': resolve(__dirname, "src/index.ts"),
      },
      formats: ["es"],
    },
    outDir: "build/bundles",
    rollupOptions: {
      external: ["fs/promises", "path", "fs", "util", "events", "crypto", "bun:sqlite"],
    },
    sourcemap: true,
    target: "esnext",
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
})
