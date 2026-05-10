import type { ApiResponse, PageResponse } from '@/types/api-response'
import type {
  UserCreateRequest,
  UserDetail,
  UserListItem,
  UserPreference,
  UserPreferenceUpdateRequest,
  UserSelfUpdateRequest,
  UserStatusUpdateRequest,
  UserUpdateRequest,
} from '@/types/rbac'
import { http } from '@/services/http'
import { unwrapApiBody, unwrapApiOk } from '@/utils/api-unwrap'

export async function fetchUserList(params: {
  current?: number
  size?: number
  login?: string
}): Promise<PageResponse<UserListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<UserListItem>>>('/api/users', { params })
  return unwrapApiBody(data, '加载用户列表失败')
}

export async function createUser(payload: UserCreateRequest): Promise<UserDetail> {
  const { data } = await http.post<ApiResponse<UserDetail>>('/api/users', payload)
  return unwrapApiBody(data, '创建用户失败')
}

export async function fetchUserDetail(id: number): Promise<UserDetail> {
  const { data } = await http.get<ApiResponse<UserDetail>>(`/api/users/${id}`)
  return unwrapApiBody(data, '加载用户详情失败')
}

export async function updateUser(id: number, payload: UserUpdateRequest): Promise<UserDetail> {
  const { data } = await http.put<ApiResponse<UserDetail>>(`/api/users/${id}`, payload)
  return unwrapApiBody(data, '更新用户失败')
}

export async function updateUserStatus(id: number, payload: UserStatusUpdateRequest): Promise<UserDetail> {
  const { data } = await http.put<ApiResponse<UserDetail>>(`/api/users/${id}/status`, payload)
  return unwrapApiBody(data, '更新用户状态失败')
}

export async function deleteUser(id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/users/${id}`)
  unwrapApiOk(data, '删除用户失败')
}

export async function fetchCurrentUser(): Promise<UserDetail> {
  const { data } = await http.get<ApiResponse<UserDetail>>('/api/users/me')
  return unwrapApiBody(data, '加载当前用户失败')
}

export async function updateCurrentUserProfile(payload: UserSelfUpdateRequest): Promise<UserDetail> {
  const { data } = await http.put<ApiResponse<UserDetail>>('/api/users/me', payload)
  return unwrapApiBody(data, '更新个人资料失败')
}

export async function fetchUserPreference(id: number): Promise<UserPreference> {
  const { data } = await http.get<ApiResponse<UserPreference>>(`/api/users/${id}/preferences`)
  return unwrapApiBody(data, '加载用户偏好设置失败')
}

export async function updateUserPreference(id: number, payload: UserPreferenceUpdateRequest): Promise<UserPreference> {
  const { data } = await http.put<ApiResponse<UserPreference>>(`/api/users/${id}/preferences`, payload)
  return unwrapApiBody(data, '更新用户偏好设置失败')
}

export async function fetchCurrentUserPreference(): Promise<UserPreference> {
  const { data } = await http.get<ApiResponse<UserPreference>>('/api/users/me/preferences')
  return unwrapApiBody(data, '加载当前用户偏好设置失败')
}

export async function updateCurrentUserPreference(payload: UserPreferenceUpdateRequest): Promise<UserPreference> {
  const { data } = await http.put<ApiResponse<UserPreference>>('/api/users/me/preferences', payload)
  return unwrapApiBody(data, '更新当前用户偏好设置失败')
}

