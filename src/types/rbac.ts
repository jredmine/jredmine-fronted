export interface Permission {
  key: string
  name: string
  category: string
  description: string
}

export interface RoleListItem {
  id: number
  name: string
  position: number | null
  assignable: boolean | null
  builtin: number | null
}

export interface RoleDetail {
  id: number
  name: string
  position: number | null
  assignable: boolean | null
  builtin: number | null
  permissions: string[]
  issuesVisibility: string | null
  usersVisibility: string | null
  timeEntriesVisibility: string | null
  allRolesManaged: boolean | null
  settings: string | null
  defaultTimeEntryActivityId: number | null
}

export interface RoleCreateRequest {
  name: string
  position?: number
  assignable?: boolean
  permissions: string[]
  issuesVisibility?: string
  usersVisibility?: string
  timeEntriesVisibility?: string
  allRolesManaged?: boolean
  settings?: string
}

export interface RoleUpdateRequest {
  name?: string
  position?: number
  assignable?: boolean
  permissions?: string[]
  issuesVisibility?: string
  usersVisibility?: string
  timeEntriesVisibility?: string
  allRolesManaged?: boolean
  settings?: string
}

export interface RoleCopyRequest {
  name: string
}

export interface UserListItem {
  id: number
  login: string
  firstname: string
  lastname: string
  admin: boolean | null
  status: number | null
  createdOn: string | null
}

export interface UserDetail {
  id: number
  login: string
  firstname: string
  lastname: string
  admin: boolean | null
  status: number | null
  lastLoginOn: string | null
  language: string | null
  createdOn: string | null
  updatedOn: string | null
  mailNotification: string | null
}

export interface UserCreateRequest {
  login: string
  password: string
  firstname: string
  lastname: string
  email: string
  admin?: boolean
  status?: number
  language?: string
  mailNotification?: string
}

export interface UserUpdateRequest {
  firstname?: string
  lastname?: string
  email?: string
  admin?: boolean
  status?: number
  language?: string
  mailNotification?: string
}

export interface UserStatusUpdateRequest {
  status: number
}

export interface UserPreference {
  userId: number
  hideMail: boolean | null
  timeZone: string | null
  others: string | null
}

export interface UserPreferenceUpdateRequest {
  hideMail?: boolean
  timeZone?: string
  others?: string
}

