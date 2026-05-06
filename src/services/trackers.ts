import type { ApiResponse, PageResponse } from '@/types/api-response'
import type { TrackerListItem, TrackerListQuery } from '@/types/tracker'
import { http } from '@/services/http'
import { unwrapApiBody } from '@/utils/api-unwrap'

export async function fetchTrackerList(params: TrackerListQuery): Promise<PageResponse<TrackerListItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<TrackerListItem>>>('/api/trackers', { params })
  return unwrapApiBody(data, '加载跟踪器列表失败')
}

