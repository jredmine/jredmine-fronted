import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

import { router } from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api-response'
import type { UserLoginResponse } from '@/types/user'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const http = axios.create({
  baseURL: baseURL || undefined,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** 并发 401 时复用同一次刷新，避免多次 refresh */
let refreshPromise: Promise<boolean> | null = null

function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  const auth = useAuthStore()
  const token = auth.accessToken
  if (!token) return Promise.resolve(false)

  refreshPromise = http
    .post<ApiResponse<UserLoginResponse>>('/api/auth/refresh', { token })
    .then(({ data: body }) => {
      if (body.success && body.data) {
        auth.applyLoginPayload(body.data)
        return true
      }
      return false
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

function isAuthPath(url: string) {
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/password/')
  )
}

http.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status
    const originalRequest = err.config as InternalAxiosRequestConfig | undefined

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url ?? ''

      if (url.includes('/api/auth/refresh')) {
        const auth = useAuthStore()
        auth.clearSession()
        if (router.currentRoute.value.name !== 'Login') {
          void router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
        }
        ElMessage.warning('登录已失效，请重新登录')
        return Promise.reject(err)
      }

      if (isAuthPath(url)) {
        return Promise.reject(err)
      }

      originalRequest._retry = true
      const ok = await refreshAccessToken()
      if (ok) {
        const newToken = useAuthStore().accessToken
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return http(originalRequest)
        }
      }

      const auth = useAuthStore()
      auth.clearSession()
      if (router.currentRoute.value.name !== 'Login') {
        void router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
      }
      ElMessage.warning('登录已失效，请重新登录')
      return Promise.reject(err)
    }

    if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    }
    return Promise.reject(err)
  },
)
