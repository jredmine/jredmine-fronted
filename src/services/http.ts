import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { router } from '@/router'

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

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status
    if (status === 401) {
      const auth = useAuthStore()
      auth.clearSession()
      if (router.currentRoute.value.name !== 'Login') {
        void router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
      }
      ElMessage.warning('登录已失效，请重新登录')
    } else if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    }
    return Promise.reject(err)
  },
)
