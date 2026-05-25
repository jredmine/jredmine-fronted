import type { ApiResponse, PageResponse } from '@/types/api-response'
import type {
  ProjectCreatePayload,
  ProjectDetail,
  ProjectListItem,
  ProjectListQuery,
  ProjectMember,
  ProjectStatistics,
  ProjectTreeNode,
  ProjectUpdatePayload,
} from '@/types/project'
import { http } from '@/services/http'
import { unwrapApiBody, unwrapApiOk } from '@/utils/api-unwrap'

export async function fetchProjectList(params: ProjectListQuery): Promise<PageResponse<ProjectListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<ProjectListItem>>>('/api/projects', { params })
  return unwrapApiBody(data, '加载项目列表失败')
}

export async function fetchProjectTree(rootId?: number): Promise<ProjectTreeNode[]> {
  const { data } = await http.get<ApiResponse<ProjectTreeNode[]>>('/api/projects/tree', {
    params: rootId != null ? { rootId } : {},
  })
  return unwrapApiBody(data, '加载项目树失败')
}

export async function fetchProjectDetail(id: number): Promise<ProjectDetail> {
  const { data } = await http.get<ApiResponse<ProjectDetail>>(`/api/projects/${id}`)
  return unwrapApiBody(data, '加载项目详情失败')
}

export async function fetchProjectStatistics(id: number): Promise<ProjectStatistics> {
  const { data } = await http.get<ApiResponse<ProjectStatistics>>(`/api/projects/${id}/statistics`)
  return unwrapApiBody(data, '加载项目统计失败')
}

export async function createProject(payload: ProjectCreatePayload): Promise<ProjectDetail> {
  const { data } = await http.post<ApiResponse<ProjectDetail>>('/api/projects', payload)
  return unwrapApiBody(data, '创建项目失败')
}

export async function updateProject(id: number, payload: ProjectUpdatePayload): Promise<ProjectDetail> {
  const { data } = await http.put<ApiResponse<ProjectDetail>>(`/api/projects/${id}`, payload)
  return unwrapApiBody(data, '更新项目失败')
}

export async function deleteProject(id: number): Promise<void> {
  const { data } = await http.delete<ApiResponse<unknown>>(`/api/projects/${id}`)
  unwrapApiOk(data, '删除项目失败')
}

export async function fetchProjectMembers(
  projectId: number,
  params: { current?: number; size?: number; name?: string },
): Promise<PageResponse<ProjectMember>> {
  const { data } = await http.get<ApiResponse<PageResponse<ProjectMember>>>(
    `/api/projects/${projectId}/members`,
    { params },
  )
  return unwrapApiBody(data, '加载项目成员失败')
}
