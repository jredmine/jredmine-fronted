export interface IssueListQuery {
  current?: number
  size?: number
  projectId?: number
  statusId?: number
  /** true=仅已关闭状态，false=仅打开状态；与 statusId 互斥时以 statusId 为准 */
  statusIsClosed?: boolean
  trackerId?: number
  priorityId?: number
  assignedToId?: number
  authorId?: number
  categoryId?: number
  fixedVersionId?: number
  keyword?: string
  isPrivate?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IssueListItem {
  id: number
  trackerId: number | null
  trackerName: string | null
  projectId: number | null
  projectName: string | null
  subject: string
  statusId: number | null
  statusName: string | null
  assignedToId: number | null
  assignedToName: string | null
  priorityId: number | null
  priorityName: string | null
  authorId: number | null
  authorName: string | null
  createdOn: string | null
  updatedOn: string | null
  dueDate: string | null
  doneRatio: number | null
  isPrivate: boolean | null
}

export interface IssueDetail {
  id: number
  trackerId: number | null
  trackerName: string | null
  projectId: number | null
  projectName: string | null
  subject: string
  description: string | null
  dueDate: string | null
  categoryId: number | null
  categoryName: string | null
  statusId: number | null
  statusName: string | null
  assignedToId: number | null
  assignedToName: string | null
  priorityId: number | null
  priorityName: string | null
  fixedVersionId: number | null
  fixedVersionName: string | null
  authorId: number | null
  authorName: string | null
  createdOn: string | null
  updatedOn: string | null
  startDate: string | null
  doneRatio: number | null
  estimatedHours: number | null
  parentId: number | null
  rootId: number | null
  isPrivate: boolean | null
  closedOn: string | null
}

export interface IssueCreatePayload {
  projectId: number
  trackerId: number
  subject: string
  description?: string
  statusId?: number
  priorityId: number
  assignedToId?: number
  categoryId?: number
  fixedVersionId?: number
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  doneRatio?: number
  parentId?: number
  isPrivate?: boolean
}

