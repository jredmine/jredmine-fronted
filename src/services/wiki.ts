import type { ApiResponse, PageResponse } from '@/types/api-response'
import type {
  WikiInfo,
  WikiPageCreatePayload,
  WikiPageDetail,
  WikiPageListItem,
  WikiPageUpdatePayload,
  WikiUpdatePayload,
} from '@/types/wiki'
import { http } from '@/services/http'
import { unwrapApiBody } from '@/utils/api-unwrap'

export async function fetchProjectWiki(projectId: number): Promise<WikiInfo> {
  const { data } = await http.get<ApiResponse<WikiInfo>>(`/api/projects/${projectId}/wiki`)
  return unwrapApiBody(data, '加载 Wiki 信息失败')
}

export async function updateProjectWiki(projectId: number, payload: WikiUpdatePayload): Promise<WikiInfo> {
  const { data } = await http.put<ApiResponse<WikiInfo>>(`/api/projects/${projectId}/wiki`, payload)
  return unwrapApiBody(data, '更新 Wiki 设置失败')
}

export async function fetchWikiPageList(
  projectId: number,
  params: { current?: number; size?: number; parentId?: number },
): Promise<PageResponse<WikiPageListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<WikiPageListItem>>>(
    `/api/projects/${projectId}/wiki/pages`,
    { params },
  )
  return unwrapApiBody(data, '加载 Wiki 页面列表失败')
}

export async function createWikiPage(projectId: number, payload: WikiPageCreatePayload): Promise<WikiPageDetail> {
  const { data } = await http.post<ApiResponse<WikiPageDetail>>(`/api/projects/${projectId}/wiki/pages`, payload)
  return unwrapApiBody(data, '创建 Wiki 页面失败')
}

export async function fetchWikiPage(projectId: number, titleOrId: string | number): Promise<WikiPageDetail> {
  const segment = encodeURIComponent(String(titleOrId))
  const { data } = await http.get<ApiResponse<WikiPageDetail>>(`/api/projects/${projectId}/wiki/pages/${segment}`)
  return unwrapApiBody(data, '加载 Wiki 页面失败')
}

export async function updateWikiPage(
  projectId: number,
  titleOrId: string | number,
  payload: WikiPageUpdatePayload,
): Promise<WikiPageDetail> {
  const segment = encodeURIComponent(String(titleOrId))
  const { data } = await http.put<ApiResponse<WikiPageDetail>>(`/api/projects/${projectId}/wiki/pages/${segment}`, payload)
  return unwrapApiBody(data, '更新 Wiki 页面失败')
}
