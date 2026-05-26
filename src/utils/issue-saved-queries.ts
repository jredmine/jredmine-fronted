import type { SavedIssueQuery } from '@/types/issue-filter'

const STORAGE_PREFIX = 'jredmine_issue_queries'

function storageKey(userId: number): string {
  return `${STORAGE_PREFIX}_${userId}`
}

export function listSavedIssueQueries(userId: number, projectId: number | null): SavedIssueQuery[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const all = JSON.parse(raw) as SavedIssueQuery[]
    return all
      .filter((q) => q.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

export function saveIssueQuery(userId: number, query: SavedIssueQuery): void {
  const all = listAllForUser(userId)
  const idx = all.findIndex((q) => q.id === query.id)
  if (idx >= 0) all[idx] = query
  else all.push(query)
  localStorage.setItem(storageKey(userId), JSON.stringify(all))
}

export function deleteSavedIssueQuery(userId: number, queryId: string): void {
  const all = listAllForUser(userId).filter((q) => q.id !== queryId)
  localStorage.setItem(storageKey(userId), JSON.stringify(all))
}

function listAllForUser(userId: number): SavedIssueQuery[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    return JSON.parse(raw) as SavedIssueQuery[]
  } catch {
    return []
  }
}

export function createSavedIssueQueryId(): string {
  return `sq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
