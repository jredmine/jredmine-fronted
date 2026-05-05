import 'axios'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** 401 后尝试刷新 Token 并重试时标记，避免无限循环 */
    _retry?: boolean
  }
}
