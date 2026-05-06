import type { ApiResponse } from '@/types/api-response'

/** 解析 HTTP 200 且 body 为 ApiResponse 的成功载荷 */
export function unwrapApiBody<T>(body: ApiResponse<T>, fallback: string): T {
  if (!body.success || body.data === undefined || body.data === null) {
    throw new Error(body.message || fallback)
  }
  return body.data
}
