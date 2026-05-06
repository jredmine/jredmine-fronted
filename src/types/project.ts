/** 列表项，对齐 ProjectListItemResponseDTO */
export interface ProjectListItem {
  id: number
  name: string
  description: string | null
  identifier: string | null
  isPublic: boolean | null
  status: number | null
  parentId: number | null
  createdOn: string | null
  updatedOn: string | null
}

/** 详情，对齐 ProjectDetailResponseDTO */
export interface ProjectDetail {
  id: number
  name: string
  description: string | null
  homepage: string | null
  isPublic: boolean | null
  parentId: number | null
  createdOn: string | null
  updatedOn: string | null
  identifier: string | null
  status: number | null
  inheritMembers: boolean | null
  defaultVersionId: number | null
  defaultAssignedToId: number | null
  defaultIssueQueryId: number | null
}

export interface ProjectTreeNode extends ProjectListItem {
  children?: ProjectTreeNode[] | null
}

export interface ProjectCreatePayload {
  name: string
  description?: string
  homepage?: string
  isPublic?: boolean
  parentId?: number | null
  identifier?: string
  inheritMembers?: boolean
  enabledModules?: string[]
  trackerIds?: number[]
}

export interface ProjectUpdatePayload {
  name?: string
  description?: string
  homepage?: string
  isPublic?: boolean
  parentId?: number | null
  identifier?: string
  status?: number
  inheritMembers?: boolean
  enabledModules?: string[]
  trackerIds?: number[]
}

export interface ProjectMember {
  id: number
  userId: number
  login: string
  firstname: string | null
  lastname: string | null
  email: string | null
  createdOn: string | null
  mailNotification: boolean | null
  roles: Array<{
    roleId: number
    roleName: string
    inherited: boolean | null
  }>
}

export interface ProjectListQuery {
  current?: number
  size?: number
  name?: string
  keyword?: string
  status?: number
  isPublic?: boolean
  parentId?: number
}
