import { Application } from "typedoc"
import { MarkdownPageEvent } from "typedoc-plugin-markdown"

export function load(app: Application) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (event: any) => {
    let title = event.model?.name || event.project?.name || "Untitled"
    title = title.replace("API Reference", "API Reference Overview")

    event.frontmatter = {
      ...(event.frontmatter || {}),
      editUrl: false,
      next: false,
      prev: false,
      title,
    }
  })

  app.renderer.on(MarkdownPageEvent.END, (event: any) => {
    if (!event.contents) return
    // Remove all H1 headings
    event.contents = event.contents.replace(/^[ \t]*#[ \t]+.*$/gm, "").trim()
  })
}
