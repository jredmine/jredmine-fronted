/** 第一版支持的动态过滤器字段 */
export type IssueFilterKey = 'status' | 'tracker' | 'priority' | 'assignedTo'

/** 状态筛选值 */
export type StatusFilterValue = 'open' | 'closed' | number

/** 指派给筛选值 */
export type AssignedToFilterValue = 'me' | 'unassigned' | number

export type IssueFilterValue = StatusFilterValue | AssignedToFilterValue | number | ''

export interface IssueFilterRow {
  id: string
  key: IssueFilterKey
  enabled: boolean
  value: IssueFilterValue
}

export interface IssueFilterDefinition {
  key: IssueFilterKey
  label: string
}

export interface IssuePriorityItem {
  id: number
  name: string
  position?: number | null
}

export interface AssigneeFilterOption {
  value: AssignedToFilterValue
  label: string
}
