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

  // const minify = true

  return {
    base: env.VITE_TARGET === "electron" ? "./" : "/",
    build: {
      // minify,
      outDir: "build",
      rollupOptions: {
        output: {
          sourcemapBaseUrl: env.VITE_TARGET === "electron" ? "file:///" : undefined,
        },
      },
      sourcemap: true,
    },
    // TODO8
    // Module "url" has been externalized for browser compatibility, imported by "/home/runner/work/privatefolio/privatefolio/node_modules/web-push/src/web-push-lib.js".
    // define: {
    //   // Define Node.js globals for browser compatibility
    //   global: "globalThis",
    // },
    // optimizeDeps: {
    //   // Exclude server-side dependencies from pre-bundling
    //   exclude: ["web-push", "https-proxy-agent", "jws"],
    // },
    plugins: [
      MillionLint.vite({
        enabled: false,
      }),
      react(),
      visualizer({
        // brotliSize: true,
        filename: "build/bundle-analysis.html",
        gzipSize: true,
        open: true,
        template: "treemap",
      }),
    ],
    resolve: {
      alias: {
        src: "/src",
      },
    },
  }
})
