import type { IssueListQuery } from '@/types/issue'
import type {
  AssignedToFilterValue,
  IssueFilterKey,
  IssueFilterRow,
  IssueFilterValue,
  StatusFilterValue,
} from '@/types/issue-filter'

const FILTER_SEP = '|'
const FILTER_VAL_SEP = '~'

export const ISSUE_FILTER_DEFINITIONS: { key: IssueFilterKey; label: string }[] = [
  { key: 'status', label: '状态' },
  { key: 'tracker', label: '跟踪' },
  { key: 'priority', label: '优先级' },
  { key: 'assignedTo', label: '指派给' },
]

let rowIdSeq = 0

export function createFilterRow(key: IssueFilterKey, value?: IssueFilterValue): IssueFilterRow {
  return {
    id: `f-${++rowIdSeq}-${Date.now()}`,
    key,
    enabled: true,
    value: value ?? defaultValueForKey(key),
  }
}

function defaultValueForKey(key: IssueFilterKey): IssueFilterValue {
  switch (key) {
    case 'status':
      return 'open'
    case 'assignedTo':
      return 'me'
    default:
      return ''
  }
}

export function defaultFilterRows(): IssueFilterRow[] {
  return [createFilterRow('status', 'open')]
}

function encodeValue(value: IssueFilterValue): string {
  return String(value)
}

function decodeValue(key: IssueFilterKey, raw: string): IssueFilterValue {
  if (key === 'status') {
    if (raw === 'open' || raw === 'closed') return raw
    const n = Number(raw)
    return Number.isNaN(n) ? 'open' : n
  }
  if (key === 'assignedTo') {
    if (raw === 'me' || raw === 'unassigned') return raw
    const n = Number(raw)
    return Number.isNaN(n) ? '' : n
  }
  const n = Number(raw)
  return Number.isNaN(n) ? '' : n
}

export function serializeFiltersToQuery(rows: IssueFilterRow[]): string {
  return rows
    .filter((r) => r.enabled && r.value !== '' && r.value != null)
    .map((r) => `${r.key}${FILTER_VAL_SEP}${encodeValue(r.value)}`)
    .join(FILTER_SEP)
}

export function parseFiltersFromQuery(raw: unknown): IssueFilterRow[] {
  const s = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
  if (!s || typeof s !== 'string') return []

  const validKeys = new Set(ISSUE_FILTER_DEFINITIONS.map((d) => d.key))
  const rows: IssueFilterRow[] = []

  for (const part of s.split(FILTER_SEP)) {
    const idx = part.indexOf(FILTER_VAL_SEP)
    if (idx <= 0) continue
    const key = part.slice(0, idx) as IssueFilterKey
    if (!validKeys.has(key)) continue
    const value = decodeValue(key, part.slice(idx + FILTER_VAL_SEP.length))
    rows.push(createFilterRow(key, value))
  }
  return rows
}

export function filtersToListQuery(
  rows: IssueFilterRow[],
  currentUserId?: number | null,
): Pick<
  IssueListQuery,
  'statusId' | 'statusIsClosed' | 'trackerId' | 'priorityId' | 'assignedToId'
> {
  const params: Pick<
    IssueListQuery,
    'statusId' | 'statusIsClosed' | 'trackerId' | 'priorityId' | 'assignedToId'
  > = {}

  for (const row of rows) {
    if (!row.enabled || row.value === '' || row.value == null) continue

    switch (row.key) {
      case 'status': {
        const v = row.value as StatusFilterValue
        if (typeof v === 'number') params.statusId = v
        else if (v === 'open') params.statusIsClosed = false
        else if (v === 'closed') params.statusIsClosed = true
        break
      }
      case 'tracker':
        if (typeof row.value === 'number') params.trackerId = row.value
        break
      case 'priority':
        if (typeof row.value === 'number') params.priorityId = row.value
        break
      case 'assignedTo': {
        const v = row.value as AssignedToFilterValue
        if (v === 'unassigned') params.assignedToId = 0
        else if (v === 'me' && currentUserId) params.assignedToId = currentUserId
        else if (typeof v === 'number') params.assignedToId = v
        break
      }
    }
  }

  return params
}
