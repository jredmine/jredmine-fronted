/** 动态过滤器字段 */
export type IssueFilterKey =
  | 'status'
  | 'tracker'
  | 'priority'
  | 'assignedTo'
  | 'author'
  | 'category'
  | 'createdOn'
  | 'updatedOn'

export type StatusFilterValue = 'open' | 'closed' | number

export type UserRefFilterValue = 'me' | 'unassigned' | number

export type AuthorFilterValue = 'me' | number

export type CategoryFilterValue = 'none' | number

export interface DateRangeValue {
  from?: string
  to?: string
}

export type IssueFilterValue =
  | StatusFilterValue
  | UserRefFilterValue
  | AuthorFilterValue
  | CategoryFilterValue
  | DateRangeValue
  | number
  | ''

export interface IssueFilterRow {
  id: string
  key: IssueFilterKey
  enabled: boolean
  value: IssueFilterValue
}

export interface IssueFilterDefinition {
  key: IssueFilterKey
  label: string
  /** 仅项目内列表可用 */
  projectOnly?: boolean
}

export interface IssuePriorityItem {
  id: number
  name: string
  position?: number | null
}

export interface IssueCategoryItem {
  id: number
  projectId: number
  name: string
}

export interface UserFilterOption {
  value: UserRefFilterValue | AuthorFilterValue
  label: string
}

/** 已保存的自定义查询（存于 localStorage） */
export interface SavedIssueQuery {
  id: string
  name: string
  /** null 表示全局问题列表 */
  projectId: number | null
  filters: string
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  createdAt: number
}
