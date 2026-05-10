import type { ApiResponse, PageResponse } from '@/types/api-response'
import type { IssueCreatePayload, IssueDetail, IssueListItem, IssueListQuery } from '@/types/issue'
import { http } from '@/services/http'
import { unwrapApiBody } from '@/utils/api-unwrap'

export async function fetchIssueList(params: IssueListQuery): Promise<PageResponse<IssueListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<IssueListItem>>>('/api/issues', { params })
  return unwrapApiBody(data, '加载问题列表失败')
}

export async function fetchIssueDetail(id: number): Promise<IssueDetail> {
  const { data } = await http.get<ApiResponse<IssueDetail>>(`/api/issues/${id}`)
  return unwrapApiBody(data, '加载问题详情失败')
}

export async function createIssue(payload: IssueCreatePayload): Promise<IssueDetail> {
  const { data } = await http.post<ApiResponse<IssueDetail>>('/api/issues', payload)
  return unwrapApiBody(data, '创建问题失败')
}

