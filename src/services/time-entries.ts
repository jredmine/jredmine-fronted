import type { ApiResponse, PageResponse } from '@/types/api-response'
import type {
  TimeEntryActivity,
  TimeEntryCreatePayload,
  TimeEntryItem,
  TimeEntryQuery,
} from '@/types/time-entry'
import { http } from '@/services/http'
import { unwrapApiBody } from '@/utils/api-unwrap'

export async function fetchTimeEntryActivities(): Promise<TimeEntryActivity[]> {
  const { data } = await http.get<ApiResponse<TimeEntryActivity[]>>('/api/time-entries/activities')
  return unwrapApiBody(data, '加载工时活动类型失败')
}

export async function fetchTimeEntryList(params: TimeEntryQuery): Promise<PageResponse<TimeEntryItem>> {
  const { data } = await http.get<ApiResponse<PageResponse<TimeEntryItem>>>('/api/time-entries', { params })
  return unwrapApiBody(data, '加载工时记录失败')
}

export async function createTimeEntry(payload: TimeEntryCreatePayload): Promise<TimeEntryItem> {
  const { data } = await http.post<ApiResponse<TimeEntryItem>>('/api/time-entries', payload)
  return unwrapApiBody(data, '登记工时失败')
}
