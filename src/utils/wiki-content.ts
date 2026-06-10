import { marked } from 'marked'

marked.use({
  gfm: true,
  breaks: true,
})

/** 将 Markdown 解析为 HTML（完整 GFM） */
export function renderMarkdown(text: string | null | undefined): string {
  if (text == null || text.trim() === '') return ''
  return marked.parse(text.trim(), { async: false }) as string
}

/** @deprecated 使用 renderMarkdown */
export function renderWikiMarkdown(text: string | null | undefined): string {
  return renderMarkdown(text)
}
