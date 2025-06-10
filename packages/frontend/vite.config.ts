import MillionLint from "@million/lint"
import react from "@vitejs/plugin-react"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig, loadEnv } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  if (!env.VITE_POSTHOG_KEY) {
    console.warn("⚠️ Warning: Missing VITE_POSTHOG_KEY!!!")
  }

  if (env.VITE_TARGET) {
    console.warn("⚠️ Building for target:", env.VITE_TARGET)
  }

  return {
    base: env.VITE_TARGET === "electron" ? "./" : "/",
    build: {
      outDir: "build",
      sourcemap: true,
    },
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
  }
})
