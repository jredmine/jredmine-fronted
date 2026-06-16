export interface TimeEntryActivity {
  id: number
  name: string
  isDefault?: boolean | null
}

export interface TimeEntryUser {
  id: number
  login: string
  firstname?: string | null
  lastname?: string | null
}

export interface TimeEntryItem {
  id: number
  issueId: number | null
  issueSubject: string | null
  user: TimeEntryUser | null
  hours: number
  spentOn: string
  activityId: number
  activityName: string | null
  comments: string | null
  createdOn: string | null
}

export interface TimeEntryCreatePayload {
  projectId: number
  issueId?: number
  userId?: number
  hours: number
  spentOn: string
  activityId: number
  comments?: string
}

export interface TimeEntryQuery {
  projectId?: number
  issueId?: number
  pageNum?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
