/** 格式化为 yyyy-MM-dd HH:mm */
export function formatDateTime(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '—'
  const d = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(raw)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Redmine 风格的相对时间描述（不含「之前」后缀） */
export function formatRelativeTimeZh(raw: string | null | undefined): string {
  if (raw == null || raw === '') return ''
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) return '刚刚'

  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(diffMs / 3_600_000)
  const days = Math.floor(diffMs / 86_400_000)

  if (minutes < 1) return '不到 1 分钟'
  if (minutes < 60) return `大约 ${minutes} 分钟`
  if (hours < 24) return `大约 ${hours} 小时`
  if (days < 30) return `${days} 天`

  const months = Math.round(days / 30)
  if (days < 365) {
    return months >= 11 ? `将近 ${months} 个月` : `大约 ${months} 个月`
  }

  const years = Math.round(days / 365)
  return years >= 2 ? `将近 ${years} 年` : '大约 1 年'
}
