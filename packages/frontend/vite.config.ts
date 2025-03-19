import MillionLint from "@million/lint"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // for electron to load the app correctly in production
  build: {
    outDir: "build",
  },
  // https://github.com/pouchdb/pouchdb/issues/8516#issuecomment-1546129302
  define: { global: typeof window === "undefined" ? "self" : "window" },
  plugins: [
    MillionLint.vite({
      enabled: false,
    }),
    react(),
    visualizer({
      // brotliSize: true,
      filename: "build/bundle-analysis.html",
      gzipSize: true,
      open: false,
      template: "sunburst",
    }),
  ],
  resolve: {
    alias: {
      src: "/src",
    },
  },
})
