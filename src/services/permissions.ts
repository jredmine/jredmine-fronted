import type { ApiResponse } from '@/types/api-response'
import type { Permission } from '@/types/rbac'
import { http } from '@/services/http'
import { unwrapApiBody } from '@/utils/api-unwrap'

export async function fetchAllPermissions(): Promise<Permission[]> {
  const { data } = await http.get<ApiResponse<Permission[]>>('/api/permissions')
  return unwrapApiBody(data, '加载权限列表失败')
}

