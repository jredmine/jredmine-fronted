export interface TrackerListItem {
  id: number
  name: string
  description?: string | null
  isInChlog?: boolean | null
  position?: number | null
  isDefault?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface TrackerListQuery {
  current?: number
  size?: number
  name?: string
}

