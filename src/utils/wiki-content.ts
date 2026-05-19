import { marked } from 'marked'

marked.use({
  gfm: true,
  breaks: true,
})

/** 将 Wiki 正文解析为 HTML（完整 Markdown，含 GFM） */
export function renderWikiMarkdown(text: string | null | undefined): string {
  if (text == null || text.trim() === '') return ''
  return marked.parse(text.trim(), { async: false }) as string
}
