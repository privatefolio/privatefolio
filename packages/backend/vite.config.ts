import path from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig, Plugin } from "vite"

function sourceListComment(): Plugin {
  return {
    name: "source-list-comment",
    renderChunk(code, chunk) {
      const sources = Object.keys(chunk.modules)
        .map((p) => path.relative(process.cwd(), p))
        .sort()
      const header = `// Sources for this chunk:\n// ${sources.join("\n// ")}\n`
      return { code: header + code, map: null }
    },
  }
}

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
    minify: false,
    outDir: "build/bundles",
    rollupOptions: {
      external: [
        "fs/promises",
        "path",
        "fs",
        "util",
        "events",
        "crypto",
        "bun:sqlite",
        "node:fs",
        "node:stream",
        "node:util",
        "node:readline",
        "stream",
        "child_process",
        "os",
        "url",
        "https",
        "http",
        "net",
        "tls",
        "assert",
        "sqlite3",
        "sqlite",
      ],
      output: {
        // chunkFileNames: "chunks/[name]/[name].js",
        // entryFileNames: "[name].js",
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor"
          if (id.includes("src/extensions")) return "extensions"
          // if (id.includes("src/extensions")) {
          //   const rel = path.relative(process.cwd(), id).replace(/\\/g, "/")
          //   const after = rel.slice("src/extensions/".length) // e.g. "group/name/x.ts" or "name.ts"
          //   const parts = after.split("/") // ["group","name","x.ts"] or ["name.ts"]

          //   let name = parts[1] ?? parts[0] // prefer 2nd seg (grouped), else 1st
          //   if (!name) return

          //   // strip extension if it's a file
          //   name = name.replace(/\.[^/.]+$/, "")

          //   // if it's ".../<name>/index.ts", use folder name
          //   if (name === "index" && parts[0]) name = parts[0]

          //   return `extension-${name}`
          // }
        },
      },
      plugins: [sourceListComment()],
    },
    sourcemap: "inline",
    target: "esnext",
  },
  plugins: [
    visualizer({
      // brotliSize: true,
      filename: "build/bundle-analysis.html",
      gzipSize: true,
      // open: true,
      template: "treemap",
    }),
  ],
  resolve: {
    alias: {
      src: "/src",
    },
  },
})
