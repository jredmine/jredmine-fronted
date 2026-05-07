import type { ApiResponse } from '@/types/api-response'
import type {
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  UserLoginResponse,
  UserRegisterRequest,
  UserRegisterResponse,
} from '@/types/user'
import { http } from '@/services/http'

function ensureSuccess<T>(body: ApiResponse<T>, fallback: string): T {
  if (!body.success || body.data === undefined || body.data === null) {
    throw new Error(body.message || fallback)
  }
  return body.data
}

function ensureOk(body: ApiResponse<unknown>, fallback: string): void {
  if (!body.success) {
    throw new Error(body.message || fallback)
  }
}

export async function loginApi(login: string, password: string): Promise<UserLoginResponse> {
  const { data } = await http.post<ApiResponse<UserLoginResponse>>('/api/auth/login', {
    login,
    password,
  })
  return ensureSuccess(data, '登录失败')
}

export async function registerApi(payload: UserRegisterRequest): Promise<UserRegisterResponse> {
  const { data } = await http.post<ApiResponse<UserRegisterResponse>>('/api/auth/register', {
    ...payload,
    hideEmailFlag: payload.hideEmailFlag ?? false,
  })
  return ensureSuccess(data, '注册失败')
}

/**
 * 刷新 Token（与后端 /api/auth/refresh 对齐）
 * 注意：当前项目的 401 自动刷新逻辑在 `src/services/http.ts` 内部使用同一路径完成。
 */
export async function refreshTokenApi(token: string): Promise<UserLoginResponse> {
  const { data } = await http.post<ApiResponse<UserLoginResponse>>('/api/auth/refresh', { token })
  return ensureSuccess(data, 'Token 刷新失败')
}

export async function changePasswordApi(payload: PasswordChangeRequest): Promise<void> {
  const { data } = await http.post<ApiResponse<unknown>>('/api/auth/change-password', payload)
  ensureOk(data, '密码变更失败')
}

export async function confirmPasswordResetApi(payload: PasswordResetConfirmRequest): Promise<void> {
  const { data } = await http.post<ApiResponse<unknown>>('/api/auth/password/reset/confirm', payload)
  ensureOk(data, '密码重置失败')
}

export async function requestPasswordResetApi(payload: PasswordResetRequest): Promise<void> {
  const { data } = await http.post<ApiResponse<unknown>>('/api/auth/password/reset', payload)
  ensureOk(data, '请求密码重置失败')
}
