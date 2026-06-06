export interface IssueStatusItem {
  id: number
  name: string
  description?: string | null
  isClosed?: boolean | null
  position?: number | null
  defaultDoneRatio?: number | null
}

export interface AvailableTransition {
  statusId: number
  statusName: string
  assignee?: boolean | null
  author?: boolean | null
}

export interface WorkflowTransition {
  currentStatusId: number
  currentStatusName: string
  availableTransitions: AvailableTransition[]
}
