const { MarkdownPageEvent } = require("typedoc-plugin-markdown")

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
function load(app) {
  // Rewrite internal .md links before writing
  app.renderer.on(MarkdownPageEvent.END, (event) => {
    let content = event.contents ?? ""

    // README.md or index.md → /
    content = content.replace(/(?:\/|^)(README|index)\.md(#[\w-]+)?/gi, (_m, _name, hash = "") =>
      `/${hash || ""}`.replace(/\/#/, "#")
    )

    // Strip .md / .mdx extensions
    content = content.replace(/\.mdx?(?=(\)|\]|#|$))/gi, "")

    // Lowercase relative link paths (not external URLs or anchors) and remove @ symbols
    content = content.replace(
      /\[([^\]]+)\]\((?!https?:|mailto:|#)([^)]+)\)/g,
      (_m, label, link) => `[${label}](${link.toLowerCase().replace(/@/g, "")})`
    )

    // Collapse accidental double slashes
    content = content.replace(/([^:])\/{2,}/g, "$1/")

    event.contents = content
  })
}

module.exports = { load }
