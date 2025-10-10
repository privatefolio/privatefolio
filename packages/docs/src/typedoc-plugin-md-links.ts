import { Application } from "typedoc"
import { MarkdownPageEvent } from "typedoc-plugin-markdown"

export function load(app: Application) {
  // Rewrite internal .md links before writing
  app.renderer.on(MarkdownPageEvent.END, (event: any) => {
    let content = event.contents ?? ""

    // README.md or index.md → /
    content = content.replace(
      /(?:\/|^)(README|index)\.md(#[\w-]+)?/gi,
      (_m: string, _name: string, hash = "") => `/${hash || ""}`.replace(/\/#/, "#")
    )

    // Strip .md / .mdx extensions
    content = content.replace(/\.mdx?(?=(\)|\]|#|$))/gi, "")

    // Lowercase relative link paths (not external URLs or anchors) and remove @ symbols
    content = content.replace(
      /\[([^\]]+)\]\((?!https?:|mailto:|#)([^)]+)\)/g,
      (_m: string, label: string, link: string) =>
        `[${label}](${link.toLowerCase().replace(/@/g, "")})`
    )

    // Collapse accidental double slashes
    content = content.replace(/([^:])\/{2,}/g, "$1/")

    event.contents = content
  })
}
