const { MarkdownPageEvent } = require("typedoc-plugin-markdown")

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (event) => {
    let title = event.model?.name || event.project?.name || "Untitled"
    title = title.replace("API Reference", "API Reference Overview")

    event.frontmatter = {
      ...(event.frontmatter || {}),
      editUrl: false,
      next: false,
      pagefind: false,
      prev: false,
      title,
    }
  })

  app.renderer.on(MarkdownPageEvent.END, (event) => {
    if (!event.contents) return
    // Remove all H1 headings
    event.contents = event.contents.replace(/^[ \t]*#[ \t]+.*$/gm, "").trim()
  })
}

module.exports = { load }
