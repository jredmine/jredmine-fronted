import type { ApiResponse, PageResponse } from '@/types/api-response'
import type {
  IssueAssignPayload,
  IssueCopyPayload,
  IssueCreatePayload,
  IssueDetail,
  IssueListItem,
  IssueListQuery,
  IssueStatusUpdatePayload,
  IssueUpdatePayload,
} from '@/types/issue'
import type { IssuePriorityItem } from '@/types/issue-filter'
import type { WorkflowTransition } from '@/types/workflow'
import { http } from '@/services/http'
import { unwrapApiBody, unwrapApiOk } from '@/utils/api-unwrap'

export async function fetchIssueList(params: IssueListQuery): Promise<PageResponse<IssueListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<IssueListItem>>>('/api/issues', { params })
  return unwrapApiBody(data, '加载问题列表失败')
}

export async function fetchIssuePriorities(): Promise<IssuePriorityItem[]> {
  const { data } = await http.get<ApiResponse<IssuePriorityItem[]>>('/api/issues/priorities')
  return unwrapApiBody(data, '加载优先级列表失败')
}

export async function fetchIssueDetail(id: number): Promise<IssueDetail> {
  const { data } = await http.get<ApiResponse<IssueDetail>>(`/api/issues/${id}`)
  return unwrapApiBody(data, '加载问题详情失败')
}

export async function fetchIssueTransitions(id: number): Promise<WorkflowTransition> {
  const { data } = await http.get<ApiResponse<WorkflowTransition>>(`/api/issues/${id}/transitions`)
  return unwrapApiBody(data, '加载状态转换失败')
}

export async function createIssue(payload: IssueCreatePayload): Promise<IssueDetail> {
  const { data } = await http.post<ApiResponse<IssueDetail>>('/api/issues', payload)
  return unwrapApiBody(data, '创建问题失败')
}

export async function copyIssue(id: number, payload: IssueCopyPayload = {}): Promise<IssueDetail> {
  const { data } = await http.post<ApiResponse<IssueDetail>>(`/api/issues/${id}/copy`, payload)
  return unwrapApiBody(data, '复制问题失败')
}

export async function updateIssue(id: number, payload: IssueUpdatePayload): Promise<IssueDetail> {
  const { data } = await http.put<ApiResponse<IssueDetail>>(`/api/issues/${id}`, payload)
  return unwrapApiBody(data, '更新问题失败')
}

export async function updateIssueStatus(id: number, payload: IssueStatusUpdatePayload): Promise<IssueDetail> {
  const { data } = await http.put<ApiResponse<IssueDetail>>(`/api/issues/${id}/status`, payload)
  return unwrapApiBody(data, '更新问题状态失败')
}

export async function assignIssue(id: number, payload: IssueAssignPayload): Promise<IssueDetail> {
  const { data } = await http.put<ApiResponse<IssueDetail>>(`/api/issues/${id}/assign`, payload)
  return unwrapApiBody(data, '更新指派人失败')
}

export async function deleteIssue(id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/issues/${id}`)
  unwrapApiOk(data, '删除问题失败')
}

export async function addIssueWatcher(issueId: number, userId: number): Promise<void> {
  const { data } = await http.post<ApiResponse<unknown>>(`/api/issues/${issueId}/watchers`, { userId })
  unwrapApiOk(data, '关注失败')
}

export async function deleteIssueWatcher(issueId: number, userId: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/issues/${issueId}/watchers/${userId}`)
  unwrapApiOk(data, '取消关注失败')
}

