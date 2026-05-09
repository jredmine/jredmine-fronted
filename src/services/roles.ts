import type { ApiResponse, PageResponse } from '@/types/api-response'
import type {
  RoleCopyRequest,
  RoleCreateRequest,
  RoleDetail,
  RoleListItem,
  RoleUpdateRequest,
} from '@/types/rbac'
import { http } from '@/services/http'
import { unwrapApiBody, unwrapApiOk } from '@/utils/api-unwrap'

export async function fetchRoleList(params: {
  current?: number
  size?: number
  name?: string
  builtin?: number
  assignable?: boolean
}): Promise<PageResponse<RoleListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<RoleListItem>>>('/api/roles', { params })
  return unwrapApiBody(data, '加载角色列表失败')
}

export async function fetchRoleDetail(id: number): Promise<RoleDetail> {
  const { data } = await http.get<ApiResponse<RoleDetail>>(`/api/roles/${id}`)
  return unwrapApiBody(data, '加载角色详情失败')
}

export async function createRole(payload: RoleCreateRequest): Promise<RoleDetail> {
  const { data } = await http.post<ApiResponse<RoleDetail>>('/api/roles', payload)
  return unwrapApiBody(data, '创建角色失败')
}

export async function updateRole(id: number, payload: RoleUpdateRequest): Promise<RoleDetail> {
  const { data } = await http.put<ApiResponse<RoleDetail>>(`/api/roles/${id}`, payload)
  return unwrapApiBody(data, '更新角色失败')
}

export async function copyRole(id: number, payload: RoleCopyRequest): Promise<RoleDetail> {
  const { data } = await http.post<ApiResponse<RoleDetail>>(`/api/roles/${id}/copy`, payload)
  return unwrapApiBody(data, '复制角色失败')
}

export async function deleteRole(id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/roles/${id}`)
  unwrapApiOk(data, '删除角色失败')
}

export async function fetchManagedRoles(id: number): Promise<RoleListItem[]> {
  const { data } = await http.get<ApiResponse<RoleListItem[]>>(`/api/roles/${id}/managed-roles`)
  return unwrapApiBody(data, '加载可管理角色失败')
}

export async function updateManagedRoles(id: number, managedRoleIds: number[]): Promise<void> {
  const { data } = await http.put<ApiResponse<unknown>>(`/api/roles/${id}/managed-roles`, { managedRoleIds })
  unwrapApiOk(data, '更新角色管理关系失败')
}

export async function addManagedRole(id: number, managedRoleId: number): Promise<void> {
  const { data } = await http.post<ApiResponse<unknown>>(`/api/roles/${id}/managed-roles/${managedRoleId}`)
  unwrapApiOk(data, '添加角色管理关系失败')
}

export async function removeManagedRole(id: number, managedRoleId: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/roles/${id}/managed-roles/${managedRoleId}`)
  unwrapApiOk(data, '删除角色管理关系失败')
}

