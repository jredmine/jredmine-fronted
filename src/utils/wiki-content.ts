/** 从 Wiki 正文中提取可展示内容（支持 ```html 代码块包裹的 HTML） */
export function prepareWikiDisplay(text: string | null | undefined): { mode: 'html' | 'text'; content: string } {
  if (text == null || text.trim() === '') {
    return { mode: 'text', content: '' }
  }
  let body = text.trim()
  const fenced = body.match(/^```(?:html|markdown|md|textile)?\s*([\s\S]*?)\s*```$/i)
  if (fenced) {
    body = fenced[1].trim()
  }
  if (/<[a-z][\s\S]*>/i.test(body)) {
    return { mode: 'html', content: body }
  }
  return { mode: 'text', content: text.trim() }
}
