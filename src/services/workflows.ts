import type { ApiResponse } from '@/types/api-response'
import type { IssueStatusItem } from '@/types/workflow'
import { http } from '@/services/http'
import { unwrapApiBody } from '@/utils/api-unwrap'

export async function fetchIssueStatusList(): Promise<IssueStatusItem[]> {
  const { data } = await http.get<ApiResponse<IssueStatusItem[]>>('/api/workflows/statuses')
  return unwrapApiBody(data, '加载问题状态失败')
}
