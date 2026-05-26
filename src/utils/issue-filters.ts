import type { IssueListQuery } from '@/types/issue'
import type {
  AuthorFilterValue,
  CategoryFilterValue,
  DateRangeValue,
  IssueFilterDefinition,
  IssueFilterKey,
  IssueFilterRow,
  IssueFilterValue,
  StatusFilterValue,
  UserRefFilterValue,
} from '@/types/issue-filter'

const FILTER_SEP = '|'
const FILTER_VAL_SEP = '~'
const DATE_RANGE_SEP = '/'

export const ISSUE_FILTER_DEFINITIONS: IssueFilterDefinition[] = [
  { key: 'status', label: '状态' },
  { key: 'tracker', label: '跟踪' },
  { key: 'priority', label: '优先级' },
  { key: 'assignedTo', label: '指派给' },
  { key: 'author', label: '作者' },
  { key: 'category', label: '类别', projectOnly: true },
  { key: 'createdOn', label: '创建于' },
  { key: 'updatedOn', label: '更新于' },
]

let rowIdSeq = 0

export function isDateRangeKey(key: IssueFilterKey): boolean {
  return key === 'createdOn' || key === 'updatedOn'
}

export function isDateRangeValue(value: IssueFilterValue): value is DateRangeValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('from' in value || 'to' in value)
}

export function isEmptyDateRange(value: DateRangeValue): boolean {
  return !value.from && !value.to
}

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
    case 'createdOn':
    case 'updatedOn':
      return { from: '', to: '' }
    default:
      return ''
  }
}

export function defaultFilterRows(): IssueFilterRow[] {
  return [createFilterRow('status', 'open')]
}

function encodeValue(key: IssueFilterKey, value: IssueFilterValue): string {
  if (isDateRangeKey(key) && isDateRangeValue(value)) {
    return `${value.from ?? ''}${DATE_RANGE_SEP}${value.to ?? ''}`
  }
  return String(value)
}

function decodeDateRange(raw: string): DateRangeValue {
  const [from = '', to = ''] = raw.split(DATE_RANGE_SEP)
  return { from: from || undefined, to: to || undefined }
}

function decodeValue(key: IssueFilterKey, raw: string): IssueFilterValue {
  if (isDateRangeKey(key)) {
    return decodeDateRange(raw)
  }
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
  if (key === 'author') {
    if (raw === 'me') return raw
    const n = Number(raw)
    return Number.isNaN(n) ? '' : n
  }
  if (key === 'category') {
    if (raw === 'none') return 'none'
    const n = Number(raw)
    return Number.isNaN(n) ? '' : n
  }
  const n = Number(raw)
  return Number.isNaN(n) ? '' : n
}

function rowHasValue(row: IssueFilterRow): boolean {
  if (!row.enabled) return false
  if (isDateRangeKey(row.key) && isDateRangeValue(row.value)) {
    return !isEmptyDateRange(row.value)
  }
  return row.value !== '' && row.value != null
}

export function serializeFiltersToQuery(rows: IssueFilterRow[]): string {
  return rows
    .filter(rowHasValue)
    .map((r) => `${r.key}${FILTER_VAL_SEP}${encodeValue(r.key, r.value)}`)
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
  | 'statusId'
  | 'statusIsClosed'
  | 'trackerId'
  | 'priorityId'
  | 'assignedToId'
  | 'authorId'
  | 'categoryId'
  | 'createdOnFrom'
  | 'createdOnTo'
  | 'updatedOnFrom'
  | 'updatedOnTo'
> {
  const params: Pick<
    IssueListQuery,
    | 'statusId'
    | 'statusIsClosed'
    | 'trackerId'
    | 'priorityId'
    | 'assignedToId'
    | 'authorId'
    | 'categoryId'
    | 'createdOnFrom'
    | 'createdOnTo'
    | 'updatedOnFrom'
    | 'updatedOnTo'
  > = {}

  for (const row of rows) {
    if (!rowHasValue(row)) continue

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
        const v = row.value as UserRefFilterValue
        if (v === 'unassigned') params.assignedToId = 0
        else if (v === 'me' && currentUserId) params.assignedToId = currentUserId
        else if (typeof v === 'number') params.assignedToId = v
        break
      }
      case 'author': {
        const v = row.value as AuthorFilterValue
        if (v === 'me' && currentUserId) params.authorId = currentUserId
        else if (typeof v === 'number') params.authorId = v
        break
      }
      case 'category': {
        const v = row.value as CategoryFilterValue
        if (v === 'none') params.categoryId = 0
        else if (typeof v === 'number') params.categoryId = v
        break
      }
      case 'createdOn': {
        const v = row.value as DateRangeValue
        if (v.from) params.createdOnFrom = v.from
        if (v.to) params.createdOnTo = v.to
        break
      }
      case 'updatedOn': {
        const v = row.value as DateRangeValue
        if (v.from) params.updatedOnFrom = v.from
        if (v.to) params.updatedOnTo = v.to
        break
      }
    }
  }

  return params
}

export function operatorLabel(key: IssueFilterKey): string {
  return isDateRangeKey(key) ? '介于' : '等于'
}
