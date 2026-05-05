import { isAxiosError } from 'axios'

/**
 * 从请求失败中解析后端 ApiResponse.message。
 * AxiosError 同样继承 Error，必须先按 Axios 解析，否则会落到错误的「status code 400」文案。
 */
export function parseBackendErrorMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e) && e.response?.data && typeof e.response.data === 'object') {
    const d = e.response.data as { message?: string }
    if (typeof d.message === 'string' && d.message.trim()) {
      return d.message
    }
  }
  if (e instanceof Error && e.message.trim()) {
    return e.message
  }
  return fallback
}
