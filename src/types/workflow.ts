export interface IssueStatusItem {
  id: number
  name: string
  description?: string | null
  isClosed?: boolean | null
  position?: number | null
  defaultDoneRatio?: number | null
}
